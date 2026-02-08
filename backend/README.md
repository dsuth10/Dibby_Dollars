# Dibby Dollars Backend

Flask 3.x REST API for the Dibby Dollars school reward banking system.

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows; or: source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set SECRET_KEY (required for production)
export FLASK_APP=app.py   # or set FLASK_APP=app.py on Windows
flask db upgrade
python seed.py
flask run
```

The API runs at `http://localhost:5000`. Default seed creates admin (admin/admin123), teacher (teacher/teacher123), and sample students.

## Environment variables

| Variable       | Description                          | Default (if unset)                    |
|----------------|--------------------------------------|--------------------------------------|
| `SECRET_KEY`   | Session signing key                  | dev key (change in production)       |
| `DATABASE_URL` | Database connection URL               | SQLite in `instance/dibby_dollars.db` |
| `FLASK_ENV`    | `development`, `production`, `testing` | unset (development)                |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `http://localhost:5173,http://127.0.0.1:5173` |

Copy `.env.example` to `.env` and set at least `SECRET_KEY` for production.

### Production CORS Configuration

Set `CORS_ORIGINS` to your production frontend URL(s):

```bash
CORS_ORIGINS=https://dibby.yourschool.edu
```

For multiple domains, use comma separation (no spaces):

```bash
CORS_ORIGINS=https://dibby.yourschool.edu,https://admin.yourschool.edu
```

## Tests

```bash
export FLASK_APP=app.py
pip install -r requirements.txt
pytest tests/ -v
```

## Database migrations

After changing `api/models.py`, create and apply a migration:

```bash
export FLASK_APP=app.py   # or set FLASK_APP=app.py on Windows
flask db migrate -m "Description of change"
flask db upgrade
```

Use `flask db downgrade` to roll back one revision.

## Deployment

- Set `FLASK_ENV=production` and a strong `SECRET_KEY`.
- Set `CORS_ORIGINS` to your production frontend URL(s).
- Prefer PostgreSQL for production: set `DATABASE_URL` to your Postgres connection string.
- Run `flask db upgrade` after deploying code that includes new migrations.
- Use a production WSGI server (e.g. Gunicorn): `gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"`.

## API Endpoints

- `POST /auth/login` - User authentication
- `GET /students` - List all students (Teacher+)
- `POST /transactions/award` - Award DB$ to student (Teacher+)
- `GET /balance/me` - Get current user balance
- `GET /analytics/leaderboard` - Top savers (Teacher+)
