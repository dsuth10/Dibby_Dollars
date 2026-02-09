# Hostinger KVM 2 VPS Setup Guide for Multiple Flask Applications

**Date Created**: February 9, 2026  
**Target**: Educational Flask Applications (Dibby Dollars + Additional Projects)  
**Hosting Provider**: Hostinger  
**VPS Plan**: KVM 2 ($10.79 AUD/month)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Plan Specifications](#plan-specifications)
3. [Cost Analysis](#cost-analysis)
4. [Pre-Setup Preparation](#pre-setup-preparation)
5. [Initial VPS Provisioning](#initial-vps-provisioning)
6. [Operating System Configuration](#operating-system-configuration)
7. [Core Software Installation](#core-software-installation)
8. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
9. [Individual Flask Application Deployment](#individual-flask-application-deployment)
10. [Background Task Scheduling](#background-task-scheduling)
11. [Database Configuration](#database-configuration)
12. [Security Hardening](#security-hardening)
13. [Monitoring and Maintenance](#monitoring-and-maintenance)
14. [Troubleshooting](#troubleshooting)

---

## Executive Summary

The **KVM 2 plan** at $10.79 AUD/month provides the optimal balance of cost, performance, and capacity for hosting educational Flask applications. This guide walks you through deploying multiple applications on a single VPS, specifically targeting:

- **Dibby Dollars** (student banking system with scheduled tasks)
- Your existing Flask application
- Future educational technology projects (4-6 total applications supported)

This guide assumes a Hostinger VPS running **Ubuntu 24.04 LTS** installed as a plain OS (no control panel), selected from the Hostinger "Choose an operating system" screen.

**Key Benefits**:
- Unlimited background task scheduling (critical for Dibby Dollars interest calculations)
- Full root access and complete control
- Scalable database architecture
- Professional DevOps workflow with Git deployments
- Cost-effective compared to platform-as-a-service options

---

## Plan Specifications

### Hardware Allocation

| Resource | Specification |
|----------|---------------|
| **vCPU Cores** | 2 dedicated cores |
| **RAM** | 8 GB |
| **Storage** | 100 GB SSD |
| **Bandwidth** | 8 TB/month |
| **IP Address** | 1 dedicated IPv4 |
| **Backup** | Weekly automated (7-day retention) |

### Monthly Costs (Australian)

| Item | First 6 Months | After Renewal |
|------|----------------|--------------|
| **KVM 2 VPS** | $7.69 - $10.79 AUD | $16.92 AUD |
| **Domain Registration** | $0 (use existing) | Varies by registrar |
| **SSL Certificate** | $0 (Let's Encrypt) | $0 (Let's Encrypt) |
| **Estimated Total** | $7.69 - $10.79 AUD | $16.92 AUD |

**Note**: Hostinger frequently offers promotions for first-time VPS customers. Check for discount codes before purchasing.

### Performance Characteristics

**Expected Capacity**:
- 4-6 simultaneous Flask applications
- 50-100 concurrent users per application
- 500 requests/second total across all apps
- Up to 2-3 GB active application memory

**Suitable For**:
- School-wide applications (primary schools, small secondary schools)
- Educational technology platforms
- Internal administrative tools
- Student management systems

**Not Suitable For**:
- Multi-school district deployments (1000+ concurrent users)
- Real-time video streaming
- High-frequency trading systems

---

## Cost Analysis

### Comparison to Alternatives

#### PythonAnywhere Developer Plan ($10-12 USD / ~$15-18 AUD)

| Feature | PythonAnywhere | Hostinger KVM 2 |
|---------|----------------|-----------------|
| **Monthly Cost** | $15-18 AUD | $10.79 AUD |
| **Web Applications** | 4 | 4-6 |
| **Database Choice** | MySQL only | PostgreSQL, MySQL, SQLite |
| **Background Tasks** | 1 always-on | Unlimited |
| **Root Access** | No | Yes |
| **CPU Throttling** | Yes | No |
| **Scheduled Tasks** | 20/month limit | Unlimited cron jobs |
| **Git Deployment** | Limited | Full SSH/Git |

**Verdict**: Hostinger KVM 2 offers **superior flexibility and cost** with full control over your infrastructure.

#### Render.com Free Tier

| Feature | Render | Hostinger KVM 2 |
|---------|--------|-----------------|
| **Cost** | $0/month | $10.79 AUD |
| **Uptime SLA** | 99% | 99.9% |
| **Background Tasks** | Limited | Unlimited |
| **Database** | PostgreSQL included | Your choice |
| **Scaling** | Automatic | Manual |

**Verdict**: Render is free but suitable only for development/small projects. Hostinger is production-grade.

---

## Pre-Setup Preparation

### Prerequisites

Before you begin, ensure you have:

1. **Active Hostinger Account**
   - Your account should already be set up with WordPress hosting
   - Access to Hostinger control panel (hPanel)
   - Existing domain(s) you want to use

2. **Domain Management**
   - Primary domain: `yourdomain.com.au` (for WordPress)
   - Subdomains for applications:
     - `dibby.yourdomain.com.au` (Dibby Dollars)
     - `app2.yourdomain.com.au` (Your existing app)
     - `app3.yourdomain.com.au` (Future projects)
   - Access to update DNS records

3. **Local Development Environment**
   - Terminal/command line access (macOS/Linux/Windows WSL2)
   - SSH client (built-in on macOS/Linux, PuTTY or Windows Terminal on Windows)
   - Git installed locally (`git --version` to verify)
   - Text editor (VS Code, Sublime Text, etc.)

4. **GitHub Repositories**
   - Dibby Dollars: Already at `https://github.com/dsuth10/Dibby_Dollars`
   - Your existing app: Ready to push to GitHub if not already there
   - Generated SSH keys for password-less Git deployment

5. **Time and Planning**
   - Initial setup: 45-60 minutes
   - Per-application deployment: 15-20 minutes
   - Total for 2 apps: ~90 minutes

6. **Operating system choice**
   - Hostinger VPS OS: Ubuntu 24.04 LTS
   - Install it as a **Plain OS** (not "OS with Panel" or "Application") from the Hostinger "Choose an operating system" page.

### Domain DNS Planning

Your DNS records should include:

```
yourdomain.com.au              → Hostinger WordPress (existing)
dibby.yourdomain.com.au        → KVM 2 VPS (new)
app2.yourdomain.com.au         → KVM 2 VPS (new)
www.yourdomain.com.au          → Hostinger WordPress (existing)
```

You'll configure all subdomains to point to your KVM 2 VPS IP address.

---

## Initial VPS Provisioning

### Choosing the VPS Operating System in Hostinger

When Hostinger prompts you to **"Choose an operating system"** for your new KVM VPS:

1. Stay on the **Plain OS** tab (do not select "OS with Panel" or "Application").
2. Click **Ubuntu** (orange logo tile).
3. When asked for the version, select **Ubuntu 24.04 LTS** (preferred) or **Ubuntu 22.04 LTS** if 24.04 is not available.
4. Confirm and continue – Hostinger will provision your VPS with this Ubuntu image, which matches all commands and configuration steps in this guide.

### Step 1: Purchase and Activate KVM 2 Plan

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Navigate to **Products** > **VPS**
3. Click **Order New** or **Upgrade**
4. Select **KVM 2** plan
5. Choose hosting location (select **Australia** for lowest latency)
6. Billing cycle: Select **12 months** for best renewal rate guarantee
7. Apply any available discount codes
8. Complete payment
9. **VPS activation**: Usually 2-5 minutes

### Step 2: Access Your VPS

Once activated, Hostinger will email you:
- **Root password** (temporary)
- **IP address** (e.g., `203.0.113.45`)
- **SSH connection details**

**On your local machine**, establish SSH connection:

```bash
ssh root@203.0.113.45
# Enter the temporary password when prompted
```

**Important**: You'll immediately be prompted to change the root password. Create a strong password:

```bash
# You'll be prompted for this after first login
# Generate a secure password: 
# - 16+ characters
# - Mix of uppercase, lowercase, numbers, symbols
# Example: K9@mPqR2$vLx8Nt!
```

### Step 3: Verify VPS Resources

Once logged in, verify your allocated resources:

```bash
# Check CPU cores
nproc
# Output should show: 2

# Check RAM allocation
free -h
# Output should show: 8 GB total

# Check disk space
df -h
# Output should show: 100 GB total
```

---

## Operating System Configuration

These steps assume your VPS is running Ubuntu 24.04 LTS (chosen as a Plain OS image in Hostinger's OS selection screen).

### Step 1: Update System Packages

```bash
# Update package lists
apt update

# Upgrade all packages to latest versions
apt upgrade -y

# Install essential utilities
apt install -y \
  curl \
  wget \
  git \
  nano \
  htop \
  build-essential \
  libssl-dev \
  libffi-dev
```

**This takes 5-10 minutes depending on network speed.**

### Step 2: Configure Firewall

Hostinger VPS uses UFW (Uncomplicated Firewall) by default but it's often disabled. Enable and configure it:

```bash
# Enable UFW
ufw enable

# Allow SSH (critical - do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Check firewall status
ufw status
```

**Output should show**:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### Step 3: Create Non-Root User

Running applications as root is a security risk. Create a dedicated user:

```bash
# Create user 'appuser' with home directory
useradd -m -s /bin/bash appuser

# Set password for appuser
passwd appuser
# Enter a strong password twice

# Give appuser sudo privileges
usermod -aG sudo appuser

# Switch to appuser
sudo su - appuser
```

**Going forward, perform all application operations as `appuser`, not `root`.**

### Step 4: Configure SSH Key Authentication

For secure, password-less SSH access:

```bash
# On your LOCAL machine (not the VPS)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/hostinger_vps -N ""
# This creates: ~/.ssh/hostinger_vps (private) and ~/.ssh/hostinger_vps.pub (public)

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/hostinger_vps.pub appuser@203.0.113.45

# Test password-less login
ssh -i ~/.ssh/hostinger_vps appuser@203.0.113.45
# Should log in without prompting for password
```

Add to your local `~/.ssh/config` for convenience:

```
Host hostinger-vps
    HostName 203.0.113.45
    User appuser
    IdentityFile ~/.ssh/hostinger_vps
    StrictHostKeyChecking no
```

**Then**: `ssh hostinger-vps` (no need to remember IP or username)

---

## Core Software Installation

### Step 1: Install Python 3.13

```bash
# Add Python PPA (Personal Package Archive)
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa

# Update package lists
sudo apt update

# Install Python 3.13 with development files
sudo apt install -y python3.13 python3.13-venv python3.13-dev

# Verify installation
python3.13 --version
# Output: Python 3.13.x
```

### Step 2: Install Node.js (for Frontend Builds)

If any of your apps use Node.js/React frontends (like Dibby Dollars):

```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
# Output: v22.x.x

npm --version
# Output: 10.x.x
```

### Step 3: Install Nginx

Nginx serves as your reverse proxy, routing requests to different Flask apps:

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx service
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
# Should show "active (running)"
```

### Step 4: Install PostgreSQL (Optional but Recommended)

For more robust database handling than SQLite, especially for Dibby Dollars with many concurrent users:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Switch to postgres user and create application database
sudo -u postgres psql

# Inside PostgreSQL prompt (postgres=#):
CREATE DATABASE dibby_dollars;
CREATE DATABASE app2_db;
CREATE USER appuser WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE dibby_dollars TO appuser;
GRANT ALL PRIVILEGES ON DATABASE app2_db TO appuser;
\q
# Exit PostgreSQL prompt
```

**Alternative**: Stick with SQLite for simplicity if you have <200 concurrent users.

### Step 5: Install Git

```bash
# Git is likely already installed, but ensure latest version
sudo apt install -y git

# Configure Git for your deployments
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Nginx Reverse Proxy Setup

Nginx acts as a load balancer, routing incoming requests to the appropriate Flask application based on the domain/subdomain.

### Step 1: Create Nginx Configuration for Dibby Dollars

```bash
# Create configuration file for Dibby Dollars
sudo nano /etc/nginx/sites-available/dibby-dollars.conf
```

**Paste this configuration**:

```nginx
upstream dibby_backend {
    server 127.0.0.1:5001;
}

server {
    listen 80;
    listen [::]:80;
    server_name dibby.yourdomain.com.au;

    # Redirect HTTP to HTTPS (after SSL is set up)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dibby.yourdomain.com.au;

    # SSL certificates (Let's Encrypt - set up later)
    ssl_certificate /etc/letsencrypt/live/dibby.yourdomain.com.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dibby.yourdomain.com.au/privkey.pem;

    # Proxy settings
    location / {
        proxy_pass http://dibby_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (if needed)
    location /static/ {
        alias /home/appuser/dibby-dollars/frontend/dist/;
        expires 30d;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

Save the file: **Ctrl+X**, then **Y**, then **Enter**.

### Step 2: Create Nginx Configuration for Additional Apps

```bash
sudo nano /etc/nginx/sites-available/app2.conf
```

**Paste this configuration** (modify app name and port):

```nginx
upstream app2_backend {
    server 127.0.0.1:5002;
}

server {
    listen 80;
    listen [::]:80;
    server_name app2.yourdomain.com.au;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app2.yourdomain.com.au;

    ssl_certificate /etc/letsencrypt/live/app2.yourdomain.com.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app2.yourdomain.com.au/privkey.pem;

    location / {
        proxy_pass http://app2_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

### Step 3: Enable Nginx Configurations

```bash
# Create symbolic links to enable sites
sudo ln -s /etc/nginx/sites-available/dibby-dollars.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app2.conf /etc/nginx/sites-enabled/

# Test Nginx configuration syntax
sudo nginx -t
# Output should show: "syntax is ok" and "test is successful"

# Reload Nginx to apply changes
sudo systemctl reload nginx
```

### Step 4: Set Up SSL Certificates with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate for Dibby Dollars
sudo certbot certonly --nginx -d dibby.yourdomain.com.au

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Certbot automatically configures Nginx

# Obtain SSL certificate for App 2
sudo certbot certonly --nginx -d app2.yourdomain.com.au

# Enable automatic certificate renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test certificate renewal (dry run)
sudo certbot renew --dry-run
```

**SSL certificates are now active and will auto-renew every 90 days.**

---

## Individual Flask Application Deployment

### Deployment Strategy Overview

Each Flask application will:
1. Run in its own virtual environment
2. Listen on a unique localhost port (5001, 5002, 5003, etc.)
3. Be managed by a systemd service
4. Auto-start if the VPS reboots

### Deploying Dibby Dollars (Flask Backend)

#### Step 1: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone Dibby Dollars repository
git clone https://github.com/dsuth10/Dibby_Dollars.git dibby-dollars
cd dibby-dollars/backend
```

#### Step 2: Set Up Python Virtual Environment

```bash
# Create virtual environment
python3.13 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

#### Step 3: Configure Environment Variables

```bash
# Create production .env file
nano .env
```

**Paste and customize**:

```
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=your-secure-random-key-generate-with-openssl-rand-hex-32
DATABASE_URL=sqlite:///dibby_dollars.db
# Or use PostgreSQL:
# DATABASE_URL=postgresql://appuser:secure_password@localhost/dibby_dollars

CORS_ORIGINS=https://dibby.yourdomain.com.au,https://www.dibby.yourdomain.com.au
DEBUG=False
LOG_LEVEL=INFO
```

**Generate a secure SECRET_KEY**:

```bash
# Run this command on your local machine
openssl rand -hex 32
# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Save the file: **Ctrl+X**, **Y**, **Enter**.

#### Step 4: Initialize Database

```bash
# Set Flask app
export FLASK_APP=app.py

# Run migrations
flask db upgrade

# Seed initial data
python seed.py
```

#### Step 5: Test Flask Application Locally

```bash
# Run Flask development server
flask run

# Output should show:
# * Running on http://127.0.0.1:5000
# Press Ctrl+C to stop
```

**Stop the server**: Press **Ctrl+C**.

#### Step 6: Create Systemd Service File

```bash
# Create systemd service file for Dibby Dollars
sudo nano /etc/systemd/system/dibby-dollars.service
```

**Paste this configuration**:

```ini
[Unit]
Description=Dibby Dollars Flask Application
After=network.target

[Service]
User=appuser
WorkingDirectory=/home/appuser/dibby-dollars/backend
Environment="PATH=/home/appuser/dibby-dollars/backend/venv/bin"
ExecStart=/home/appuser/dibby-dollars/backend/venv/bin/gunicorn \
    --workers=2 \
    --worker-class=sync \
    --bind=127.0.0.1:5001 \
    --timeout=60 \
    --access-logfile=/var/log/dibby-dollars-access.log \
    --error-logfile=/var/log/dibby-dollars-error.log \
    --log-level=info \
    app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save the file: **Ctrl+X**, **Y**, **Enter**.

#### Step 7: Install and Configure Gunicorn

```bash
# Activate virtual environment
source /home/appuser/dibby-dollars/backend/venv/bin/activate

# Install Gunicorn (WSGI server for production)
pip install gunicorn

# Deactivate virtual environment
deactivate
```

#### Step 8: Start Dibby Dollars Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Start the service
sudo systemctl start dibby-dollars

# Enable service to start on boot
sudo systemctl enable dibby-dollars

# Check service status
sudo systemctl status dibby-dollars

# Follow live logs
sudo journalctl -u dibby-dollars -f
# Press Ctrl+C to stop following logs
```

#### Step 9: Create Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/dibby-dollars
```

**Paste this configuration**:

```
/var/log/dibby-dollars-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 appuser appuser
    sharedscripts
    postrotate
        systemctl reload dibby-dollars > /dev/null 2>&1 || true
    endscript
}
```

Save the file: **Ctrl+X**, **Y**, **Enter**.

### Deploying Additional Flask Applications

Repeat the same process for your second application with modifications:

- **Repository**: Use your existing app's GitHub URL
- **Directory**: `/home/appuser/app2`
- **Port**: `5002`
- **Service name**: `app2.service`
- **Nginx config**: Already created above

**Quick summary for App 2**:

```bash
cd ~
git clone https://github.com/yourusername/your-app-repo.git app2
cd app2
python3.13 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
nano .env  # Configure environment
export FLASK_APP=app.py
flask db upgrade  # If using database migrations
systemctl start app2
systemctl enable app2
```

---

## Background Task Scheduling

Dibby Dollars requires reliable background task execution for:
1. **Daily snapshot** (23:55): Record all student balances
2. **Weekly interest** (Sunday 23:59): Calculate and apply interest at 2% per week

### Option 1: APScheduler (Recommended for Single Server)

APScheduler runs **within your Flask application** using the background scheduler[cite:2]:

```python
# In your Flask app (app.py)
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=23, minute=55)
def snapshot_balances():
    """Run daily at 23:55"""
    print("Snapshotting balances...")
    # Your logic here

@scheduler.scheduled_job('cron', day_of_week=6, hour=23, minute=59)
def calculate_interest():
    """Run every Sunday at 23:59"""
    print("Calculating interest...")
    # Your logic here

scheduler.start()
```

**Advantages**:
- No additional tools needed
- Runs with your Flask process
- Single point of management

**Disadvantages**:
- Stops if Flask app restarts
- Not suitable for multiple VPS instances (later scaling)

**Mitigation**: Ensure systemd restarts the service immediately if it crashes.

### Option 2: System Cron Jobs (More Reliable)

Set up Linux cron jobs that call Flask API endpoints:

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily snapshot at 23:55
55 23 * * * curl -s https://dibby.yourdomain.com.au/api/cron/snapshot-balances

# Weekly interest every Sunday at 23:59
59 23 * * 0 curl -s https://dibby.yourdomain.com.au/api/cron/calculate-interest
```

**In your Flask backend**, create protected endpoints:

```python
@app.route('/api/cron/snapshot-balances', methods=['POST'])
def cron_snapshot():
    # Verify request is from localhost (cron)
    if request.remote_addr not in ['127.0.0.1', 'localhost']:
        return {'error': 'Unauthorized'}, 403
    
    # Your snapshot logic
    return {'status': 'success'}

@app.route('/api/cron/calculate-interest', methods=['POST'])
def cron_calculate_interest():
    if request.remote_addr not in ['127.0.0.1', 'localhost']:
        return {'error': 'Unauthorized'}, 403
    
    # Your interest calculation logic
    return {'status': 'success'}
```

**Advantages**:
- Survives Flask app restarts
- Standard Linux tooling
- Highly reliable
- Works across multiple VPS instances

**Disadvantages**:
- Requires API endpoint protection
- Network latency (minimal locally)

### Option 3: Systemd Timer Units (Advanced)

Create systemd timer units for more control:

```bash
# Create timer file
sudo nano /etc/systemd/system/dibby-snapshot.timer
```

**Paste this configuration**:

```ini
[Unit]
Description=Dibby Dollars Daily Balance Snapshot
Requires=dibby-snapshot.service

[Timer]
OnCalendar=*-*-* 23:55:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
# Create service file
sudo nano /etc/systemd/system/dibby-snapshot.service
```

**Paste this configuration**:

```ini
[Unit]
Description=Dibby Dollars Snapshot Service

[Service]
Type=oneshot
User=appuser
WorkingDirectory=/home/appuser/dibby-dollars/backend
Environment="PATH=/home/appuser/dibby-dollars/backend/venv/bin"
ExecStart=/home/appuser/dibby-dollars/backend/venv/bin/python -c "from app import app, snapshot_balances; snapshot_balances()"
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable dibby-snapshot.timer
sudo systemctl start dibby-snapshot.timer
sudo systemctl list-timers  # View active timers
```

**Recommendation**: Use **Option 2 (cron)** for simplicity, or **APScheduler** if already implemented in your code.

---

## Database Configuration

### SQLite (Simple, Suitable for <200 Concurrent Users)

```bash
# Already handled by Flask-SQLAlchemy
# Database file stored at: /home/appuser/dibby-dollars/backend/instance/dibby_dollars.db

# Backup SQLite database
cp ~/dibby-dollars/backend/instance/dibby_dollars.db ~/dibby-dollars/backend/instance/dibby_dollars.db.backup

# Monitor database size
ls -lh ~/dibby-dollars/backend/instance/dibby_dollars.db
```

### PostgreSQL (Recommended for Production)

Already set up in "Core Software Installation" section.

**Connect to database**:

```bash
# Using psql command line
psql -U appuser -d dibby_dollars -h localhost

# Inside PostgreSQL prompt (dibby_dollars=#):
\dt  # List all tables
SELECT COUNT(*) FROM students;  # Example query
\q   # Quit
```

**Update Flask to use PostgreSQL**:

```bash
# Edit .env file
nano ~/dibby-dollars/backend/.env

# Change DATABASE_URL to:
DATABASE_URL=postgresql://appuser:password@localhost/dibby_dollars
```

**Install PostgreSQL driver**:

```bash
cd ~/dibby-dollars/backend
source venv/bin/activate
pip install psycopg2-binary
pip freeze > requirements.txt
```

### Database Backups

```bash
# Create backup directory
mkdir -p ~/backups

# Backup PostgreSQL database
pg_dump -U appuser dibby_dollars > ~/backups/dibby_dollars_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip ~/backups/dibby_dollars_20260209_120000.sql

# List backups
ls -lh ~/backups/
```

**Automate backups with cron**:

```bash
# Edit crontab
crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * pg_dump -U appuser dibby_dollars | gzip > ~/backups/dibby_dollars_$(date +\%Y\%m\%d).sql.gz

# Keep only last 7 backups:
0 2 * * * find ~/backups -name "dibby_dollars_*.sql.gz" -mtime +7 -delete
```

---

## Security Hardening

### Step 1: Configure SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Find and change/add these lines:
Port 2222                          # Change from default port 22
PermitRootLogin no                 # Disable root login
PasswordAuthentication no           # Disable password auth (key-only)
X11Forwarding no                   # Disable X11
MaxAuthTries 3                     # Limit login attempts
ClientAliveInterval 300             # Disconnect idle sessions

# Restart SSH service
sudo systemctl restart ssh

# Update firewall for new SSH port
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

**Update your local SSH config**:

```bash
nano ~/.ssh/config

# Modify hostinger-vps entry:
Host hostinger-vps
    HostName 203.0.113.45
    User appuser
    Port 2222
    IdentityFile ~/.ssh/hostinger_vps
```

### Step 2: Set Up Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Find and modify:
[DEFAULT]
bantime  = 86400        # Ban for 24 hours
findtime = 600          # Check last 10 minutes
maxretry = 5            # Ban after 5 failed attempts

[sshd]
enabled = true

# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### Step 3: Limit File Permissions

```bash
# Ensure proper permissions on Flask applications
chmod 750 ~/dibby-dollars
chmod 750 ~/app2

# Restrict .env files (sensitive data)
chmod 600 ~/dibby-dollars/backend/.env
chmod 600 ~/app2/.env

# Application directories readable only by appuser
ls -la ~/dibby-dollars
```

### Step 4: Configure Flask Security Headers

Add to your Flask application:

```python
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

### Step 5: Regular Security Updates

```bash
# Check for security updates
sudo apt list --upgradable

# Install all updates
sudo apt update && sudo apt upgrade -y

# Set up automatic updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Monitoring and Maintenance

### System Monitoring

```bash
# Real-time system overview
htop

# CPU and memory usage
top

# Disk usage
df -h

# Check running services
systemctl status dibby-dollars
systemctl status app2
systemctl status nginx
systemctl status postgresql

# View system logs
journalctl -n 50  # Last 50 lines
journalctl -u dibby-dollars -n 100  # Last 100 for specific service
journalctl -u dibby-dollars -f  # Follow in real-time (Ctrl+C to stop)
```

### Application Monitoring Dashboard

Create a simple monitoring script:

```bash
# Create monitoring script
nano ~/monitor.sh
```

**Paste this content**:

```bash
#!/bin/bash

echo "=== VPS Health Check ==="
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}'

echo ""
echo "Memory Usage:"
free -h | grep Mem

echo ""
echo "Disk Usage:"
df -h | grep /dev/

echo ""
echo "Service Status:"
systemctl status dibby-dollars --no-pager | grep Active
systemctl status app2 --no-pager | grep Active
systemctl status nginx --no-pager | grep Active

echo ""
echo "Database Connections:"
ps aux | grep -E "postgres|gunicorn" | grep -v grep | wc -l

echo ""
echo "Recent Errors (last 20 lines):"
sudo journalctl -u dibby-dollars -n 20 --no-pager | tail -5
```

Make it executable:

```bash
chmod +x ~/monitor.sh

# Run it
~/monitor.sh
```

### Performance Optimization

```bash
# Check number of Gunicorn workers
# Recommended: 2-4 workers for 2 vCPU core
# Formula: (2 * CPU_cores) + 1

# Edit systemd service
sudo nano /etc/systemd/system/dibby-dollars.service

# Adjust workers parameter:
# For 2 vCPU: 5 workers
ExecStart=/home/appuser/dibby-dollars/backend/venv/bin/gunicorn \
    --workers=5 \
    --worker-class=sync \
    ...

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart dibby-dollars
```

### Regular Maintenance Tasks

**Weekly**:
- Review application logs for errors
- Check disk usage (`df -h`)
- Monitor Fail2Ban bans (`sudo fail2ban-client status`)

**Monthly**:
- Run database backups manually
- Test backup restoration
- Review security updates (`sudo apt list --upgradable`)

**Quarterly**:
- Full security audit
- Update all Python packages
- Review application performance metrics

**Annually**:
- Plan capacity upgrades
- Review and update documentation
- Conduct disaster recovery testing

---

## Troubleshooting

### Application Won't Start

```bash
# Check service status with detailed output
sudo systemctl status dibby-dollars -l

# View full error logs
sudo journalctl -u dibby-dollars -n 50

# Try running Flask directly
cd ~/dibby-dollars/backend
source venv/bin/activate
python app.py

# Common issues:
# - Port already in use: lsof -i :5001
# - Missing dependencies: pip install -r requirements.txt
# - Database issues: flask db upgrade
```

### Nginx Showing 502 Bad Gateway

```bash
# Verify Flask application is running
sudo systemctl status dibby-dollars

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy configuration
sudo nginx -t

# Test Flask app locally
curl http://127.0.0.1:5001

# Restart both services
sudo systemctl restart dibby-dollars
sudo systemctl restart nginx
```

### High Memory Usage

```bash
# Identify memory-heavy processes
top

# Reduce Gunicorn workers (if too many)
sudo nano /etc/systemd/system/dibby-dollars.service
# Change --workers to lower value (e.g., 2-3)

# Check for memory leaks in application
# Add monitoring in Flask app to log memory usage
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Verify certificate in browser
# Visit: https://dibby.yourdomain.com.au
# Click lock icon > Certificate details

# Check Nginx is using correct certificates
sudo nginx -T | grep ssl_certificate
```

### Database Corruption

```bash
# For SQLite:
sqlite3 ~/dibby-dollars/backend/instance/dibby_dollars.db "PRAGMA integrity_check;"

# For PostgreSQL:
sudo -u postgres psql -d dibby_dollars -c "REINDEX DATABASE dibby_dollars;"
```

### Git Deployment Issues

```bash
# Force fetch latest changes
cd ~/dibby-dollars
git fetch --all
git reset --hard origin/main

# Pull latest code
git pull origin main

# Restart application
sudo systemctl restart dibby-dollars
```

---

## Deployment Workflow (Ongoing)

Once everything is set up, here's your standard deployment process for code updates:

### Step 1: Update Code on VPS

```bash
cd ~/dibby-dollars
git fetch origin
git pull origin main
```

### Step 2: Install New Dependencies (if any)

```bash
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

### Step 3: Run Migrations (if database schema changed)

```bash
cd ~/dibby-dollars/backend
source venv/bin/activate
export FLASK_APP=app.py
flask db upgrade
deactivate
```

### Step 4: Restart Application

```bash
sudo systemctl restart dibby-dollars
sudo systemctl status dibby-dollars
```

### Step 5: Verify Deployment

```bash
# Check application is running
curl https://dibby.yourdomain.com.au

# View recent logs
sudo journalctl -u dibby-dollars -n 20
```

---

## Cost Summary and ROI

### Monthly Recurring Costs

| Item | Cost | Duration |
|------|------|----------|
| Hostinger KVM 2 VPS | $10.79 AUD | Monthly (first 6 months) |
| Hostinger KVM 2 VPS | $16.92 AUD | Monthly (after renewal) |
| Domain Registration | Included | (already owned) |
| SSL Certificates | $0 | (Let's Encrypt free) |
| Backups | $0 | (included with VPS) |
| **Total** | **$10.79 - $16.92 AUD** | **Per month** |

### Capacity and Applications Supported

| Plan | Applications | Monthly Cost | Cost Per App |
|------|--------------|--------------|-------------|
| PythonAnywhere Free | 1 | $0 | N/A (limited) |
| PythonAnywhere Developer | 4 | $15-18 AUD | $3.75-4.50 AUD |
| **Hostinger KVM 2** | **4-6** | **$10.79 AUD** | **$1.80-2.70 AUD** |

### 5-Year Projection

**Hosting 3 applications (Dibby Dollars + 2 others)**:

| Provider | Year 1 | Year 2-5 | Total 5-Year |
|----------|--------|----------|--------------|
| PythonAnywhere | $180-216 AUD | $180-216 AUD/year | $900-1,080 AUD |
| **Hostinger KVM 2** | **$64.74 AUD** | **$203.04 AUD/year** | **$875.82 AUD** |

**Result**: Hostinger saves ~$200+ over 5 years while providing better control and unlimited scalability.

---

## Conclusion

The **Hostinger KVM 2 VPS plan at $10.79 AUD/month** provides an optimal, cost-effective platform for hosting multiple educational Flask applications. This setup gives you:

✅ **Complete control** over your infrastructure  
✅ **Reliable background task scheduling** for Dibby Dollars interest calculations  
✅ **Room to grow** with capacity for 4-6 applications  
✅ **Professional SSL/HTTPS security** with automatic renewal  
✅ **Professional DevOps workflow** with Git-based deployments  
✅ **Superior cost** compared to platform-as-a-service alternatives  
✅ **Seamless integration** with your existing Hostinger account  

**Next Steps**:
1. Purchase KVM 2 plan from Hostinger
2. Follow this guide from "Initial VPS Provisioning" section
3. Deploy Dibby Dollars using "Individual Flask Application Deployment"
4. Set up background tasks for interest calculations
5. Monitor application performance using provided scripts

For questions or issues, refer to the "Troubleshooting" section or consult official documentation for specific technologies (Nginx, Flask, PostgreSQL, systemd).

---

**Document Version**: 1.0  
**Last Updated**: February 9, 2026  
**Author**: Educational Technology Implementation Guide  
**Status**: Production Ready
