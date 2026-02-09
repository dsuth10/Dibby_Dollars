# VPS Branch Update Guide: master → main

**Date Created:** February 9, 2026  
**Purpose:** Update the VPS deployment to use the `main` branch instead of `master`

---

## What Changed

Your local repository has been updated:
- ✅ Local `master` branch renamed to `main`
- ✅ Remote `master` branch deleted
- ✅ New `main` and `develop` branches pushed to GitHub
- ✅ GitHub default branch set to `main`
- ✅ All deployment documentation updated

---

## VPS Update Required

When you're ready to deploy to your VPS, you need to update the remote tracking on the server.

### Step 1: SSH to Your VPS

```bash
ssh appuser@147.93.81.58
```

(Replace with your actual VPS IP if different)

### Step 2: Navigate to Your Application Directory

```bash
cd ~/dibby-dollars
```

### Step 3: Check Current Branch Status

```bash
git status
git branch -vv
```

You'll see something like:
```
On branch master
Your branch is up to date with 'origin/master'.
```

### Step 4: Update Remote References

```bash
# Fetch latest from GitHub (will see the new main branch)
git fetch origin

# Rename local master to main
git branch -m master main

# Set main to track origin/main
git branch -u origin/main main

# Verify the change
git branch -vv
```

You should now see:
```
* main [origin/main] ...
```

### Step 5: Verify Everything Works

```bash
# Pull latest changes (should work with main now)
git pull origin main

# Check status
git status
```

---

## Future Deployments

From now on, all your deployment commands will use `main` instead of `master`:

### Old Command (don't use anymore)
```bash
git pull origin master  ❌
```

### New Command (use this)
```bash
git pull origin main  ✅
```

### Complete Deployment Examples

**Backend-only change:**
```bash
cd ~/dibby-dollars && git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate
sudo systemctl restart dibby-dollars
```

**Frontend-only change:**
```bash
cd ~/dibby-dollars && git pull origin main
cd frontend && npm ci && VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
```

**Full deployment:**
```bash
cd ~/dibby-dollars && git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt && flask db upgrade && deactivate
cd ../frontend && npm ci && VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
sudo systemctl restart dibby-dollars
```

---

## Troubleshooting

### If you see "fatal: 'origin/master' does not appear to be a git repository"

This means the VPS is still trying to pull from the old `master` branch. Follow Step 4 above to update the tracking.

### If git pull fails after updating

```bash
# Reset to match the remote main branch
git fetch origin
git reset --hard origin/main
```

### To verify remote branches

```bash
git branch -r
```

You should see:
```
origin/HEAD -> origin/main
origin/develop
origin/main
```

---

## Important Notes

1. **The VPS won't break** - Your current deployment will continue running until you update it
2. **Update when convenient** - Do this update during your next deployment cycle
3. **One-time change** - Once you update the VPS tracking, everything will work normally
4. **All documentation updated** - Your deployment guides now reference `main` instead of `master`

---

## Quick Reference

| Action | Old Command | New Command |
|--------|-------------|-------------|
| Pull latest code | `git pull origin master` | `git pull origin main` |
| Push changes | `git push origin master` | `git push origin main` |
| Check out branch | `git checkout master` | `git checkout main` |
| Reset to remote | `git reset --hard origin/master` | `git reset --hard origin/main` |

---

**Next Steps:**
1. Keep using `develop` branch for local development
2. Merge to `main` when ready for production
3. Update VPS tracking during your next deployment
4. Use `git pull origin main` on the VPS from now on
