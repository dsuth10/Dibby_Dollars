# Step-by-step: Enable HTTPS on the VPS

Run these on the VPS as `appuser`. Use `sudo` where shown.

---

## Step 1: Get the latest Nginx config from the repo

If you haven’t pulled the HTTPS config yet:

```bash
cd ~/dibby-dollars
git pull origin main
```

You should see `deployment/nginx/dibby-dollars.conf` in the repo.

---

## Step 2: Install the Nginx HTTPS config

Copy the new config over the existing one:

```bash
sudo cp ~/dibby-dollars/deployment/nginx/dibby-dollars.conf /etc/nginx/sites-available/dibby-dollars.conf
```

---

## Step 3: Test Nginx and reload

Check that the config is valid:

```bash
sudo nginx -t
```

You should see: `syntax is ok` and `test is successful`.

Reload Nginx to use the new config:

```bash
sudo systemctl reload nginx
```

---

## Step 4: Rebuild the frontend with the HTTPS API URL

You need a build that uses `https://dibby.mrsutherland.net/api` (not `http://`):

```bash
cd ~/dibby-dollars/frontend
npm ci
VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
```

Wait for the build to finish. No need to restart any service; Nginx will serve the new files from `frontend/dist/`.

---

## Step 5: Check HTTPS in the browser

1. Open **https://dibby.mrsutherland.net** (with `https`).
2. Confirm the **padlock** icon in the address bar.
3. Try **http://dibby.mrsutherland.net** — it should redirect to `https://`.
4. Log in (e.g. teacher / teacher123) and use the app.
5. In DevTools → Network, confirm requests go to `https://dibby.mrsutherland.net/api/...` (no mixed content).

---

## Step 6 (optional): Check Certbot auto-renewal

```bash
sudo systemctl status certbot.timer
sudo certbot certificates
sudo certbot renew --dry-run
```

If the dry-run succeeds, certificates will renew automatically before they expire.

---

## If something goes wrong

- **502 Bad Gateway**  
  Backend may be down:  
  `sudo systemctl status dibby-dollars`  
  If needed: `sudo systemctl restart dibby-dollars`

- **Nginx won’t reload**  
  Check syntax: `sudo nginx -t`  
  Check logs: `sudo tail -50 /var/log/nginx/error.log`

- **No padlock / certificate errors**  
  Confirm certificates exist:  
  `sudo ls -la /etc/letsencrypt/live/dibby.mrsutherland.net/`

- **Login fails or API errors**  
  Confirm the frontend was built with the HTTPS URL (Step 4).  
  Hard refresh the page (Ctrl+Shift+R).  
  Check backend logs: `sudo journalctl -u dibby-dollars -n 50 --no-pager`
