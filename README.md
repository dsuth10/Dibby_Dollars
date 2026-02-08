# Dibby Dollars

A school-wide reward banking web app for tracking Dibby Dollars (DB$): balances, interest, raffles, and analytics. Built for primary students with separate portals for Students, Teachers, and Admins.

## Screenshots

### Login Portal
<p align="center">
  <img src="screenshots/login-page.png" alt="Login Page" width="400"/>
</p>

### Student Dashboard
Track your balance, view your ranking, and see your transaction history.
<p align="center">
  <img src="screenshots/student-dashboard.png" alt="Student Dashboard" width="400"/>
</p>

### Teacher Dashboard
Award Dibby Dollars to students and conduct weekly raffles.
<p align="center">
  <img src="screenshots/teacher-dashboard.png" alt="Teacher Dashboard" width="400"/>
</p>

### Admin Control Panel
Configure system settings, view analytics, and manage users.
<p align="center">
  <img src="screenshots/admin-dashboard.png" alt="Admin Dashboard" width="600"/>
</p>

## Hierarchy & Roles

Dibby Dollars uses a cumulative permission system:

- **Student:** View personal balance, savings rank, and transaction history.
- **Teacher:** Award DB$ to any student, manage focus behaviors (quick-award buttons), and conduct raffle draws.
- **Admin:** Configure system-wide settings (interest rate, raffle defaults), manage all users (including teachers), and trigger manual interest calculations.

## System Mechanics

### 📈 Weekly Interest
The system encourages long-term saving through automated interest:
- **Calculation:** Interest is calculated on the **minimum balance** a student held during the week. 
- **Capture:** A background service takes a "snapshot" of all balances every night at 23:55.
- **Distribution:** Interest is automatically applied every **Sunday at 23:59**.
- **Rate:** Set by Admins (default is 2%).

### 🎟️ Weekly Raffles
Teachers can conduct raffles during class or assemblies:
- **Selection:** A winner is randomly selected from all active students.
- **Prizes:** The default prize (e.g., 50 DB$) is configurable by Admins.
- **Integrity:** Every draw is recorded in the raffle history for transparency.

### 🎯 Focus Behaviors
To make awarding DB$ fast, Teachers can select 3-5 "Focus Behaviors" (e.g., *Leadership*, *Teamwork*). These appear as bright, easy-click buttons on the Teacher Dashboard.

## Quick Start

### Prerequisites

- Python 3.13+ and pip
- Node.js 22+ and npm
- Git

### Setup

1. **Clone and navigate:**
   ```bash
   git clone <repo-url>
   cd Dibby_Dollars
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows; or source venv/bin/activate on macOS/Linux
   pip install -r requirements.txt

   # Create environment file
   cp .env.example .env

   set FLASK_APP=app.py
   flask db upgrade
   python seed.py
   flask run
   ```

3. **Frontend setup** (new terminal):
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. **Access the app:**
   - Open http://localhost:5173
   - **Log in as Admin:** `admin` / `admin123`
   - **Log in as Teacher:** `teacher` / `teacher123`
   - **Log in as Student:**
     - `alice.johnson` / `1111`
     - `bob.smith` / `2222`
     - `charlie.brown` / `3333`

## Production Deployment

**Backend:**
- Use a production-grade WSGI server like **Gunicorn**.
- Set `FLASK_ENV=production` and a secure `SECRET_KEY`.
- Use a robust database like **PostgreSQL** for concurrent transaction handling.
- Ensure the background scheduler (`APScheduler`) has persistent storage if using multiple workers.

**Frontend:**
- Build the optimized production bundle: `npm run build`.
- Serve the `dist/` folder via a static host (Vercel, Netlify, Nginx).
- Ensure `VITE_API_URL` points to your production backend.

## Documentation

- [Backend Guide](backend/README.md) – Env vars, migrations, scheduler details.
- [Frontend Guide](frontend/README.md) – Component structure, state (Zustand).
- [Implementation Plan](notes/implementation_plan.md) – Original architectural vision.

## Testing

- **Backend:** `cd backend && pytest`
- **Frontend:** `cd frontend && npm run test`
- **E2E:** `cd frontend && npm run cypress:run`
