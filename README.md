# Dibby Dollars

A school-wide reward banking web app for tracking Dibby Dollars (DB$): balances, interest, raffles, and analytics. Built for primary students with separate portals for Students, Teachers, and Admins.

## Quick start

1. **Backend** (from repo root):
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows; or source venv/bin/activate on macOS/Linux
   pip install -r requirements.txt
   cp .env.example .env
   set FLASK_APP=app.py    # or export FLASK_APP=app.py
   flask db upgrade
   python seed.py
   flask run
   ```
2. **Frontend** (new terminal):
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```
3. Open http://localhost:5173 and log in with **teacher** / **teacher123** or **admin** / **admin123** (see [backend/README.md](backend/README.md) for seed users).

## Project layout

- **backend/** – Flask 3.x REST API (SQLite/Postgres, SQLAlchemy, APScheduler for interest).
- **frontend/** – React 18 + TypeScript + Vite + MUI (dark theme, glassmorphism).
- **notes/** – Implementation plan and design notes.

## Documentation

- [Backend setup, env vars, migrations, deployment](backend/README.md)
- [Frontend setup, env vars, scripts, deployment](frontend/README.md)
- [Implementation plan](notes/implementation_plan.md)

## Tests

- **Backend:** `cd backend && pytest tests/ -v`
- **Frontend unit:** `cd frontend && npm run test`
- **Frontend E2E:** Start backend + frontend, then `cd frontend && npm run cypress:run`
