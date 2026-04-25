# PHOBODTB - Social Network Application

A social network web application built with **FastAPI + MySQL** backend and **React + Vite + Tailwind CSS** frontend.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (v2+)
- Optional (for non-Docker development): Python 3.11+, Node.js 20+, MySQL 8.0

---

## Quick Start (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url>
cd database_system_assignment_hk252

# 2. Create the .env file from the example
cp .env.example .env

# 3. Build and start all services
docker compose up -d --build

# 4. Wait ~30 seconds for MySQL to initialize, then verify
docker compose logs --tail=20 backend
```

**The app will be ready at:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8001 |
| API Docs (Swagger) | http://localhost:8001/docs |
| API Docs (ReDoc) | http://localhost:8001/redoc |
| Adminer (DB Viewer) | http://localhost:8081 |

---

## Default Credentials

> These values are pre-set in `.env.example`. Using `cp .env.example .env` as-is gives every collaborator the same defaults.

| Field | Value |
|-------|-------|
| MySQL Host | `localhost` |
| MySQL Port | `3307` |
| MySQL Username | `phobousr` |
| MySQL Password | `phobopass` |
| Database Name | `PHOBODTB` |

### Adminer Login

1. Open http://localhost:8081
2. Fill in:
   - **System:** MySQL
   - **Server:** `db`
   - **Username:** `phobousr`
   - **Password:** `phobopass`
   - **Database:** `PHOBODTB`

---

## Default Demo Accounts

After the database seeds, these accounts are available. All passwords are `password123`.

| Name | Email | Role |
|------|-------|------|
| Admin User | admin@phobo.social | Admin |
| Alice Nguyen | alice@example.com | Regular user |
| Bob Tran | bob@example.com | Regular user |
| Charlie Le | charlie@example.com | Regular user |

---

## Project Structure

```
database_system_assignment_hk252/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Environment configuration
│   ├── database/            # DB connection & SQL scripts
│   │   └── init/            # Auto-runs on first MySQL startup
│   │       ├── 01_schema.sql          # Tables, indexes, FKs
│   │       ├── 02_seed.sql            # Sample data
│   │       ├── 03_triggers.sql        # DB triggers
│   │       ├── 04_procedures.sql      # Stored procedures
│   │       ├── 05_stored_query.sql    # Stored functions
│   │       └── 06_function.sql        # Additional functions
│   ├── routers/             # API route handlers
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # React root component
│   │   ├── pages/           # Page components
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # Auth context
│   │   └── services/api.ts  # API client
│   ├── package.json
│   ├── vite.config.ts       # Vite + proxy config
│   └── Dockerfile           # Nginx-based production build
├── docker-compose.yml       # Orchestrates all services
└── .env.example             # Environment variables template
```

---

## Database Initialization Scripts

On the **first** `docker compose up`, MySQL automatically executes all `.sql` files in `backend/database/init/` in alphabetical order:

| File | Description |
|------|-------------|
| `01_schema.sql` | Tables, indexes, foreign keys, constraints |
| `02_seed.sql` | Sample users, posts, friendships, groups |
| `03_triggers.sql` | Auto-delete orphaned data, update counts |
| `04_procedures.sql` | Search stored procedures |
| `05_stored_query.sql` | Stored functions (e.g., `get_mutual_friends_count`) |
| `06_function.sql` | Additional utility functions |

> **Note:** The init scripts only run when MySQL first creates the `PHOBODTB` database. To re-run them, you must destroy the volume first (see below).

---

## Common Docker Commands

```bash
# Start all services (in background)
docker compose up -d

# Stop all services (keep data volume)
docker compose down

# Stop and remove all volumes (RESETS the database)
docker compose down -v

# Rebuild after pulling code changes
docker compose up --build -d

# Follow logs for all services
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend

# Restart a specific service
docker compose restart backend

# Open a MySQL shell inside the container
docker compose exec db mysql -u phobousr -pphobopass PHOBODTB
```

---

## Connecting an External MySQL Client

If you want to connect with a GUI tool (e.g., TablePlus, DBeaver, MySQL Workbench):

| Setting | Value |
|---------|-------|
| Host | `127.0.0.1` |
| Port | `3307` |
| Username | `phobousr` |
| Password | `phobopass` |
| Database | `PHOBODTB` |

> **Important:** Use `127.0.0.1` instead of `localhost` to force a TCP/IP connection (Docker port forwarding works over TCP, not the MySQL socket).

---

## Environment Configuration

Edit `.env` in the project root. **Never commit `.env` to version control** — it is already in `.gitignore`.

```env
# Database
DB_ROOT_PASSWORD=rootpassword
DB_USER=phobousr
DB_PASSWORD=phobopass
DB_NAME=PHOBODTB

# JWT (change this to a long random string in production!)
SECRET_KEY=change-this-to-a-secure-random-string
```

After editing `.env`, restart the containers for changes to take effect:

```bash
docker compose down && docker compose up -d
```

---

## Development Without Docker

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env from the example
cp ../.env.example .env
# Edit .env: set DB_HOST=localhost, DB_PORT=3307

# Run the server
python -m uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local — empty VITE_API_BASE_URL means Vite proxy handles /api
echo "VITE_API_BASE_URL=" > .env.local

npm run dev
```

---

## Troubleshooting

### `Access denied` or database connection errors

1. Make sure MySQL is fully started: `docker compose logs db`
2. Check that `DB_HOST=localhost` and `DB_PORT=3307` in your `.env` for local dev, or `DB_HOST=db` and `DB_PORT=3306` when running via Docker compose.
3. To completely reset the database:

   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Frontend shows "Network Error" or 404

- Make sure the backend container is healthy before accessing the frontend: `docker compose ps`
- Check backend logs: `docker compose logs backend`
- Verify the backend is responding: http://localhost:8001/health

### Port already in use

If ports 8080, 8001, or 8081 are already in use on your machine, change them in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8002:8000"    # change 8001 to 8002
  frontend:
    ports:
      - "8082:80"      # change 8080 to 8082
  adminer:
    ports:
      - "8082:8080"    # change 8081 to 8082
```

Then update the URLs in the README accordingly.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS, React Router |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | MySQL 8.0 |
| Container Orchestration | Docker Compose |
| Frontend Web Server | Nginx (production) |
| DB Viewer | Adminer |
