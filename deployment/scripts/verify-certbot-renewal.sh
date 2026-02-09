#!/bin/bash
# Run ON THE VPS to verify Let's Encrypt auto-renewal.
# Usage: sudo bash verify-certbot-renewal.sh

set -e
echo "=== Certbot timer status ==="
systemctl status certbot.timer --no-pager || true
echo ""
echo "=== Certificate list ==="
certbot certificates
echo ""
echo "=== Dry-run renewal test ==="
certbot renew --dry-run
echo ""
echo "Done. If dry-run succeeded, certificates will auto-renew before expiry."
