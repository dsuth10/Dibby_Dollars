# Dibby Dollars – Deployment & Update Guide

**Created:** February 2026  
**Purpose:** Document the complete Hostinger VPS deployment for Dibby Dollars and the workflow for updating the live site from the master branch.

---

## Table of Contents

1. [Part 1: Initial Deployment Guide](#part-1-initial-deployment-guide)
   - [Overview](#overview)
   - [Phase-by-Phase Deployment](#phase-by-phase-deployment)
   - [Detailed Troubleshooting](#detailed-troubleshooting)
   - [Configuration Reference](#configuration-reference)
   - [Verification Checklist](#verification-checklist)
2. [Part 2: Update/Deployment Workflow](#part-2-update-deployment-workflow)
   - [Workflow Overview](#workflow-overview)
   - [Step-by-Step Update Process](#step-by-step-update-process)
   - [Quick Reference: Common Scenarios](#quick-reference-common-scenarios)
   - [Rollback Procedure](#rollback-procedure)
   - [Best Practices](#best-practices)

---

## Part 1: Initial Deployment Guide

### Overview

This guide covers:

- Deploying Dibby Dollars (Flask backend + React frontend) to a Hostinger KVM 2 VPS
- Using Nginx as reverse proxy and static file server
- SSL with Let's Encrypt
- All issues encountered during deployment and how they were fixed

**Prerequisites:**

- Hostinger VPS (KVM 2) with Ubuntu 24.04 LTS, already provisioned
- SSH access as `appuser` (or root) to the VPS
- Domain with DNS managed in Hostinger (e.g. mrsutherland.net)
- Local dev environment with Git; code pushed to GitHub (e.g. dsuth10/Dibby_Dollars)

**Architecture:**

```
Local dev (feature branch) → merge to master → push to GitHub
                                                    ↓
VPS: git pull → backend venv + migrations / frontend build → systemctl restart
                                                    ↓
Nginx (port 80/443) → /api/* → Gunicorn (127.0.0.1:5001)  |  /* → frontend/dist
                                                    ↓
                                            Live site (dibby.mrsutherland.net)
```

---

### Phase-by-Phase Deployment

| Phase | What | Key Steps | Issues Encountered | Solutions |
|-------|-----|-----------|--------------------|-----------|
| **1. DNS** | Point subdomain to VPS | Add A record `dibby.mrsutherland.net` → VPS IP (e.g. 147.93.81.58) | Confusion about where to add record (DNS Manager vs WordPress) | Hostinger → VPS → DNS Manager → Edit DNS for domain → Add A record (Name: `dibby`, Points to: VPS IP) |
| **2. Nginx Config** | Web server setup | Create `/etc/nginx/sites-available/dibby-dollars.conf`, enable, reload | Paste glitch caused `systemctl reload nginx` to fail | Run commands one at a time; use `q` to exit pager (not Ctrl+C when viewing status) |
| **3. SSL/HTTPS** | Let's Encrypt certificate | `certbot certonly --nginx -d dibby.mrsutherland.net` | None | Worked after DNS propagated; enable certbot.timer for renewal |
| **4. Backend** | Flask app deployment | Clone repo, venv, .env, migrations, systemd service | PostgreSQL schema permissions; Gunicorn "app" not found | See [Detailed Troubleshooting](#detailed-troubleshooting) |
| **5. Frontend** | React build | `npm ci`, `VITE_API_URL=... npm run build` | None | Build outputs to `frontend/dist/` |
| **6. Permissions** | File access for Nginx | Allow Nginx (www-data) to read frontend files | 500 error: `stat() ... Permission denied` | `chmod o+x` on `/home/appuser`, `dibby-dollars`, `frontend` so www-data can traverse to `dist/` |

---

### Detailed Troubleshooting

#### Issue 1: PostgreSQL schema permissions

- **Error:** `permission denied for schema public` when running `flask db upgrade`
- **Cause:** PostgreSQL 15+ does not grant `CREATE` on schema `public` to new database users by default.
- **Fix:** As postgres superuser, grant the app user access:

```bash
sudo -u postgres psql -d dibby_dollars -c "GRANT CREATE ON SCHEMA public TO appuser;"
sudo -u postgres psql -d dibby_dollars -c "GRANT USAGE ON SCHEMA public TO appuser;"
```

Then re-run:

```bash
cd ~/dibby-dollars/backend
source venv/bin/activate
export FLASK_APP=app.py
flask db upgrade
deactivate
```

---

#### Issue 2: Gunicorn "App failed to load"

- **Error:** `Failed to find attribute 'app' in 'app'` (service exits, restart loop)
- **Cause:** The Flask app uses an application factory (`create_app()`); there is no module-level `app` variable. Gunicorn was started with `app:app`.
- **Fix:** In `backend/app.py`, add a module-level app after the factory:

```python
# Module-level app for Gunicorn (e.g. gunicorn app:app)
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

Commit, push to master, then on VPS: `cd ~/dibby-dollars && git pull && sudo systemctl restart dibby-dollars`.

---

#### Issue 3: 500 Internal Server Error / Permission denied

- **Error:** Nginx error log: `stat() "/home/appuser/dibby-dollars/frontend/dist/index.html" failed (13: Permission denied)`
- **Cause:** Nginx runs as `www-data`. The path goes through `/home/appuser`, which is typically `750` (drwxr-x---), so "others" cannot traverse into it.
- **Fix:** Add execute (traverse) permission for others on each directory in the path:

```bash
chmod o+x /home/appuser
chmod o+x /home/appuser/dibby-dollars
chmod o+x /home/appuser/dibby-dollars/frontend
sudo systemctl reload nginx
```

This does not allow listing or reading files inside those directories; it only allows traversing to `frontend/dist/`, where files already have readable permissions.

---

#### Issue 4: Missing PostgreSQL driver

- **Error:** Would occur if `DATABASE_URL` is set to a `postgresql://` URL but the Python driver is not installed (e.g. `ModuleNotFoundError: No module named 'psycopg2'`).
- **Fix:** Add to `backend/requirements.txt`:

```
psycopg2-binary>=2.9.0
```

On the VPS, reinstall and restart:

```bash
cd ~/dibby-dollars/backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart dibby-dollars
```

---

### Configuration Reference

#### Nginx: `/etc/nginx/sites-available/dibby-dollars.conf`

**Canonical HTTPS-ready config** is in the repo: [deployment/nginx/dibby-dollars.conf](../deployment/nginx/dibby-dollars.conf). Copy to the VPS:

```bash
# On your machine (from repo root), copy to VPS:
scp deployment/nginx/dibby-dollars.conf appuser@YOUR_VPS_IP:/tmp/
# On VPS:
sudo cp /tmp/dibby-dollars.conf /etc/nginx/sites-available/dibby-dollars.conf
```

The config includes: HTTP→HTTPS redirect, port 443 SSL with Let's Encrypt paths, `/api/` proxy to Gunicorn, SPA static files, and HSTS.

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/dibby-dollars.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Systemd: `/etc/systemd/system/dibby-dollars.service`

```ini
[Unit]
Description=Dibby Dollars Flask Application
After=network.target

[Service]
User=appuser
WorkingDirectory=/home/appuser/dibby-dollars/backend
Environment="PATH=/home/appuser/dibby-dollars/backend/venv/bin"
ExecStart=/home/appuser/dibby-dollars/backend/venv/bin/gunicorn --workers=2 --worker-class=sync --bind=127.0.0.1:5001 --timeout=60 --access-logfile=/var/log/dibby-dollars-access.log --error-logfile=/var/log/dibby-dollars-error.log --log-level=info app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Log files must exist and be owned by appuser:

```bash
sudo touch /var/log/dibby-dollars-access.log /var/log/dibby-dollars-error.log
sudo chown appuser:appuser /var/log/dibby-dollars-*.log
sudo systemctl daemon-reload
sudo systemctl enable dibby-dollars
sudo systemctl start dibby-dollars
```

#### Backend `.env` (production)

Location: `~/dibby-dollars/backend/.env`

```
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=<output of: openssl rand -hex 32>
DATABASE_URL=postgresql://appuser:YOUR_POSTGRES_PASSWORD@localhost/dibby_dollars
CORS_ORIGINS=https://dibby.mrsutherland.net,https://www.mrsutherland.net,https://mrsutherland.net
DEBUG=False
LOG_LEVEL=INFO
```

Replace `YOUR_POSTGRES_PASSWORD` with the password set for the `appuser` PostgreSQL role.

#### Frontend build (production, HTTPS)

On the VPS, build with the **HTTPS** production API base URL (required once the site is served over HTTPS):

```bash
cd ~/dibby-dollars/frontend
npm ci
VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
```

Output is in `frontend/dist/`; Nginx serves from there. Use the same `VITE_API_URL` when doing frontend-only deploys (see Part 2).

---

### Verification Checklist

Use this to confirm deployment is correct:

- [ ] **DNS:** `nslookup dibby.mrsutherland.net` resolves to the VPS IP
- [ ] **Nginx:** `sudo systemctl status nginx` shows `active (running)`
- [ ] **App service:** `sudo systemctl status dibby-dollars` shows `active (running)`
- [ ] **Site loads:** Open `http://dibby.mrsutherland.net` (or https if configured) and see the Dibby Dollars login page
- [ ] **Login works:** Use seeded credentials (e.g. teacher / teacher123) and reach the dashboard
- [ ] **API works:** In browser DevTools → Network, confirm `/api/auth/login` and other API calls return 200

To exit full-screen output from `systemctl status` or `journalctl`, press **q** (not Ctrl+C).

---

## Part 2: Update/Deployment Workflow

### Workflow Overview

Use feature branches for development; merge to `master` when ready; deploy by pulling on the VPS and rebuilding/restarting as needed.

```mermaid
graph LR
    Local[Local Dev] -->|commit| Feature[feature branch]
    Feature -->|PR or merge| Master[master branch]
    Master -->|git push| GitHub[GitHub origin/master]
    GitHub -->|git pull| VPS[VPS dibby-dollars]
    VPS -->|rebuild and restart| Live[Live Site]
```

---

### Step-by-Step Update Process

#### Development phase (local)

1. **Create a feature branch** for your changes:

   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and test locally:
   - Backend: `cd backend && source venv/bin/activate && flask run`
   - Frontend: `cd frontend && npm run dev`
   - Test at `http://localhost:5173`

3. **Commit changes:**

   ```bash
   git add .
   git commit -m "feat: describe your feature"
   ```

4. **Push the feature branch** to GitHub:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Merge into master** (choose one):

   **Option A – Pull Request (recommended for review):**
   - On GitHub, open a PR from `feature/your-feature-name` into `master`
   - Review, approve, merge
   - Locally: `git checkout master && git pull origin master`

   **Option B – Local merge (solo dev):**
   ```bash
   git checkout master
   git merge feature/your-feature-name
   git push origin master
   ```

#### Deployment phase (VPS)

6. **SSH to the VPS:**

   ```bash
   ssh appuser@147.93.81.58
   ```

   (Replace with your VPS IP if different.)

7. **Pull latest code:**

   ```bash
   cd ~/dibby-dollars
   git pull origin master
   ```

8. **Backend updates** (if backend code or dependencies changed):

   ```bash
   cd ~/dibby-dollars/backend
   source venv/bin/activate

   # If requirements.txt changed:
   pip install -r requirements.txt

   # If database schema changed (new migrations):
   export FLASK_APP=app.py
   flask db upgrade

   deactivate
   ```

9. **Frontend updates** (if frontend code or dependencies changed):

   ```bash
   cd ~/dibby-dollars/frontend
   npm ci
   VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
   ```

10. **Restart the app service** (needed if backend or systemd config changed):

    ```bash
    sudo systemctl restart dibby-dollars
    sudo systemctl status dibby-dollars
    ```

    Press **q** to exit status. If the service failed, run:

    ```bash
    sudo journalctl -u dibby-dollars -n 50 --no-pager
    ```

11. **Verify deployment:**
    - Open https://dibby.mrsutherland.net (or http if HTTPS not in use)
    - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
    - Test the changed behaviour
    - If something is wrong, check logs as above

---

### Quick Reference: Common Scenarios

**Scenario 1: Backend-only change**

```bash
# On VPS
cd ~/dibby-dollars && git pull origin master
cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate
sudo systemctl restart dibby-dollars
```

**Scenario 2: Frontend-only change**

```bash
# On VPS
cd ~/dibby-dollars && git pull origin master
cd frontend && npm ci && VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
# No restart needed; Nginx serves updated static files from frontend/dist/
```

**Scenario 3: Backend and frontend changed**

```bash
# On VPS
cd ~/dibby-dollars && git pull origin master
cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate
cd ../frontend && npm ci && VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
sudo systemctl restart dibby-dollars
```

**Scenario 4: Database migration (schema change)**

```bash
# On VPS after git pull
cd ~/dibby-dollars/backend
source venv/bin/activate
export FLASK_APP=app.py
flask db upgrade
deactivate
sudo systemctl restart dibby-dollars
```

---

### Rollback Procedure

If a deployment breaks production:

1. **Find the last known good commit:**

   ```bash
   cd ~/dibby-dollars
   git log --oneline -10
   ```

2. **Check out that commit** (detached HEAD; only for recovery):

   ```bash
   git checkout <commit-hash>
   ```

3. **Rebuild and restart:**
   - If frontend was updated: `cd frontend && VITE_API_URL=https://dibby.mrsutherland.net/api npm run build`
   - If migrations were applied: `cd backend && source venv/bin/activate && export FLASK_APP=app.py && flask db downgrade -1` (or to a specific revision)
   - Restart: `sudo systemctl restart dibby-dollars`

4. **Fix the issue locally** on a branch, test, then merge to master and deploy again. For a proper rollback on master, use `git revert` or merge a revert commit instead of leaving the VPS on a detached HEAD.

---

### Best Practices

1. **Test locally first** – Run backend and frontend locally and test before pushing to master.
2. **Keep master stable** – Do development on feature branches; merge to master only when ready for production.
3. **Document breaking changes** – Use clear commit messages and, if needed, short notes in the deployment guide.
4. **Back up the database before schema migrations:**
   ```bash
   sudo -u postgres pg_dump dibby_dollars > ~/backup_dibby_$(date +%Y%m%d_%H%M).sql
   ```
5. **Monitor logs after deployment** – Run `sudo journalctl -u dibby-dollars -f` briefly after a deploy to catch startup errors.
6. **Use semantic commit messages** – e.g. `feat: add raffle export`, `fix: correct balance calculation`, `refactor: simplify auth middleware`, `docs: update deployment guide`.

---

## Appendix: One-line deployment reminders

- **Backend + restart:** `cd ~/dibby-dollars && git pull && cd backend && source venv/bin/activate && pip install -r requirements.txt && flask db upgrade && deactivate && sudo systemctl restart dibby-dollars`
- **Frontend only:** `cd ~/dibby-dollars && git pull && cd frontend && npm ci && VITE_API_URL=https://dibby.mrsutherland.net/api npm run build`
- **Full deploy (backend + frontend + restart):** Pull, then backend steps, then frontend build, then `sudo systemctl restart dibby-dollars`.

Replace paths and URLs if your setup differs (e.g. different domain or app directory).
