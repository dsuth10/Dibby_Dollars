# Dibby Dollars – Deployment (HTTPS)

## Apply HTTPS on the VPS

### 1. Copy Nginx config to the VPS

From your **local machine** (repo root):

```bash
scp deployment/nginx/dibby-dollars.conf appuser@YOUR_VPS_IP:/tmp/
```

SSH to the VPS and install the config:

```bash
ssh appuser@YOUR_VPS_IP
sudo cp /tmp/dibby-dollars.conf /etc/nginx/sites-available/dibby-dollars.conf
```

### 2. Test and reload Nginx

On the VPS:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Or run the script (after copying the config as above):

```bash
sudo bash /path/to/apply-https-nginx.sh
```

### 3. Verify HTTPS

- Open **https://dibby.mrsutherland.net** in your browser.
- Confirm the **padlock** icon appears.
- Confirm **http://dibby.mrsutherland.net** redirects to https.

### 4. Rebuild frontend with HTTPS API URL

On the VPS:

```bash
cd ~/dibby-dollars/frontend
npm ci
VITE_API_URL=https://dibby.mrsutherland.net/api npm run build
```

No service restart needed; Nginx serves the new `frontend/dist/` files.

### 5. Verify full application over HTTPS

After applying the Nginx config and rebuilding the frontend on the VPS:

1. Hard refresh the site (Ctrl+Shift+R or Cmd+Shift+R).
2. Open **https://dibby.mrsutherland.net** and confirm the **padlock** in the address bar.
3. Log in (e.g. teacher / teacher123) and confirm the dashboard loads.
4. In DevTools → Network, confirm API requests go to `https://dibby.mrsutherland.net/api/*` (no mixed content).
5. Test key flows: students list, transactions, balance.

### 6. Verify Certbot renewal

On the VPS:

```bash
sudo systemctl status certbot.timer
sudo certbot certificates
sudo certbot renew --dry-run
```
