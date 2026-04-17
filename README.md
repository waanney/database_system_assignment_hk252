# PHOBODTB - Social Network Application

A social network web application built with FastAPI + MySQL backend and React + Vite + Tailwind CSS frontend.

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd database_system_assignment_hk252

# 2. Copy environment file and start
cp .env.example .env
docker compose up -d

# 3. Access the app
# Frontend:  http://localhost:8080
# Backend:    http://localhost:8001
# API Docs:   http://localhost:8001/docs
# Database:   http://localhost:8081 (Adminer web viewer)
```

## Default Credentials (from .env.example)

| Field | Default Value |
|-------|---------------|
| MySQL Username | `phobousr` |
| MySQL Password | `phobopass` |
| Database Name | `PHOBODTB` |

These are set in `.env.example` and will be used when you copy it to `.env`. If your friend does the same (`cp .env.example .env`), they'll get the same defaults.

## Services

| Service | Port | URL |
|---------|------|-----|
| Frontend (React) | 8080 | http://localhost:8080 |
| Backend (FastAPI) | 8001 | http://localhost:8001 |
| Adminer (DB Viewer) | 8081 | http://localhost:8081 |
| MySQL | 3307 | localhost:3307 |

### Adminer Login

1. Open http://localhost:8081
2. Fill in:
   - **Server:** `db`
   - **Username:** `phobousr`
   - **Password:** `phobopass`
   - **Database:** `PHOBODTB`

## Configuration

Edit `.env` in the project root (this file is in `.gitignore` and should NOT be committed):

```env
# Database (MySQL in Docker)
DB_ROOT_PASSWORD=rootpassword
DB_USER=phobousr
DB_PASSWORD=phobopass
DB_NAME=PHOBODTB

# JWT (change this in production!)
SECRET_KEY=your-secure-random-key
```

After changing `.env`, restart the containers:

```bash
docker compose down && docker compose up -d
```

## Database

The MySQL container auto-initializes from SQL scripts in `backend/database/init/`:

| File | Description |
|------|-------------|
| `01_schema.sql` | Tables and indexes |
| `02_seed.sql` | Sample data |
| `03_triggers.sql` | Database triggers |
| `04_procedures.sql` | Stored procedures |
| `05_stored_query.sql` | Stored functions |
| `06_function.sql` | Additional functions |

## Development (Without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env    # or copy .env from a teammate
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8001" > .env.local
npm run dev
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Rebuild after code changes
docker compose up --build -d

# Stop and remove volumes (resets database)
docker compose down -v
```

## Connecting MySQL Client (External)

- **Host:** `127.0.0.1`
- **Port:** `3307`
- **Username:** `phobousr`
- **Password:** `phobopass`
- **Database:** `PHOBODTB`

> Use `127.0.0.1` instead of `localhost` to force TCP/IP connection.
