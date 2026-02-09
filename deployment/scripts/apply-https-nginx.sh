#!/bin/bash
# Run this script ON THE VPS after copying deployment/nginx/dibby-dollars.conf to
# /etc/nginx/sites-available/dibby-dollars.conf
# Usage: sudo bash apply-https-nginx.sh

set -e
echo "Testing Nginx configuration..."
nginx -t
echo "Reloading Nginx..."
systemctl reload nginx
echo "Done. Visit https://dibby.mrsutherland.net to verify the padlock."
