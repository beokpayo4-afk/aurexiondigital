# Aurexion Digital

Website and API for Aurexion Digital Private Limited.

- `frontend/` — React, Vite, TypeScript, and Tailwind CSS
- `backend/` — FastAPI, SQLAlchemy, Alembic, and PostgreSQL
- `docker-compose.yml` — PostgreSQL, the API, and the built website

Copy the example environment files and fill them in on the server. Do not commit `.env` files. The sample database password in the examples is for local Docker only.

This repository is prepared to deploy. It has not been deployed.

## Frontend setup

From `frontend/`:

```bash
npm install
cp .env.example .env.local
```

Command Prompt uses `copy .env.example .env.local`.

Set `VITE_API_BASE_URL` to the API origin the browser will call, including `/api`. The value is read when the frontend is built or when the dev server starts.

```bash
npm run dev
```

The dev server is `http://127.0.0.1:5173`.

## Backend setup

From `backend/`:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
cp .env.example .env
```

On macOS or Linux, use `.venv/bin/python` instead of `.venv/Scripts/python`. Command Prompt uses `copy .env.example .env`.

Set `DATABASE_URL` and `SECRET_KEY` in `backend/.env` before starting the API. Production refuses to start when `ENVIRONMENT` is `production` and `SECRET_KEY` is missing, still the sample value, or shorter than 32 characters.

```bash
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/api/v1/health`.

Use another host port when 8000 is already taken, and point `VITE_API_BASE_URL` at that port.

## PostgreSQL setup

Local database with Docker, from the repository root:

```bash
cp .env.example .env
docker compose up -d db
```

The default local user, password, and database name are `aurexion` unless `.env` replaces them. Keep `DATABASE_URL` in agreement with those values.

For a hosted database, put its connection string in `DATABASE_URL`. The API accepts `postgresql://` and uses the psycopg driver. Do not put that connection string in git.

## Environment variables

Root `.env` is read by Docker Compose.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` | Local Postgres user |
| `POSTGRES_PASSWORD` | Local Postgres password |
| `POSTGRES_DB` | Local Postgres database name |
| `DATABASE_URL` | SQLAlchemy connection string |
| `ENVIRONMENT` | `development` or `production` |
| `SECRET_KEY` | JWT signing secret, at least 32 characters in production |
| `CORS_ORIGINS` | Comma-separated site origins. `*` is rejected |
| `PUBLIC_SITE_URL` | Public site origin used by the sitemap |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh cookie lifetime |
| `VITE_API_BASE_URL` | API base baked into the frontend build |
| `PAYMENT_PROVIDER` | Payment provider name |
| `PAYMENT_KEY_ID` | Publishable payment key |
| `PAYMENT_KEY_SECRET` | Payment secret. Never return it from the API |
| `PAYMENT_WEBHOOK_SECRET` | Webhook signing secret |
| `PAYMENT_CURRENCY` | Currency code. Default `INR` |
| `DOWNLOAD_STORAGE_DIR` | Private directory for paid downloads |

`frontend/.env.example` only sets `VITE_API_BASE_URL`. `backend/.env.example` lists the API settings.

Admin creation reads `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional `ADMIN_FULL_NAME`. Those are not stored in the example files.

## Database migration

From `backend/`, after `DATABASE_URL` is set:

```bash
.venv/Scripts/python -m alembic upgrade head
```

The API container runs the same upgrade when it starts.

## Admin creation

Roles are created when the API starts. From `backend/`, with the virtualenv and database available:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=choose-a-long-password ADMIN_FULL_NAME="Aurexion Admin" .venv/Scripts/python scripts/create_admin.py
```

The password is not printed. If the email already exists, the script stops and leaves that account unchanged. Sign in at `/login`, then open `/admin`.

## Development commands

Frontend:

```bash
npm run dev
npm test
npm run typecheck
```

Backend:

```bash
.venv/Scripts/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
.venv/Scripts/python -m pytest -q --tb=short
.venv/Scripts/python -m alembic upgrade head
```

## Build commands

Frontend production assets:

```bash
npm run build
npm run preview
```

API image and website image, from the repository root:

```bash
docker compose build
```

## Production commands

Fill a private `.env` from `.env.example`. Set `ENVIRONMENT=production`, a unique `SECRET_KEY` of at least 32 characters, the real `DATABASE_URL`, the public site origin in `CORS_ORIGINS` and `PUBLIC_SITE_URL`, and `VITE_API_BASE_URL` to the public `/api` URL. Leave payment secrets empty until a provider is connected.

```bash
docker compose up -d --build
```

The website is published on port 8080 and the API on port 8000. The website container proxies `/api`, `/sitemap.xml`, and `/robots.txt` to the API. Put HTTPS in front of both before offering the site to customers.

Create the admin account against the production database with the command in [Admin creation](#admin-creation). Do not leave `ADMIN_PASSWORD` in a shell history file or a committed env file.

## Production checklist

- [ ] `.env` files are present only on the server and are not committed
- [ ] `ENVIRONMENT` is `production`
- [ ] `SECRET_KEY` is unique and at least 32 characters
- [ ] `DATABASE_URL` points at a private PostgreSQL database, and the sample password is not reused
- [ ] `alembic upgrade head` has been applied to that database
- [ ] An admin account has been created and the password was not written into the repository
- [ ] `CORS_ORIGINS` lists only the real site origin
- [ ] `PUBLIC_SITE_URL` and `VITE_API_BASE_URL` match the public addresses
- [ ] Payment secrets, if any, exist only in the server environment
- [ ] `DOWNLOAD_STORAGE_DIR` is a private directory when downloadable products are sold
- [ ] HTTPS terminates in front of the website and the API
- [ ] `GET /api/v1/health` returns `{"status":"ok"}`
- [ ] A customer can sign in, and an admin can open `/admin`
- [ ] Database backups are scheduled

Deployment is complete only after this checklist is done on the host that serves the site.
