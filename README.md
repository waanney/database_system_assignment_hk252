# PHOBODTB - Social Network Application

A social network web application built with **FastAPI + MySQL** backend and **React + Vite + Tailwind CSS** frontend.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (start it before running any `make` command)
- [GNU Make](https://www.gnu.org/software/make/) (available on macOS/Linux; on Windows use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install))
- Optional (for non-Docker development): Python 3.11+, Node.js 20+, MySQL 8.0

---

## Run Locally With Docker (Recommended)

> **Important:** Start Docker Desktop and wait ~30 seconds for it to fully initialize before running any `make` command.

> **Important:** Start Docker Desktop and wait ~30 seconds for it to fully initialize before running any `make` command.

```bash
# 1. Clone the repository
git clone <repo-url>
cd database_system_assignment_hk252

# 2. Create .env and start all services
make dev

# 3. Print the local URLs again any time
make urls
```

If you do not want to use the Makefile, run the equivalent Docker Compose commands:

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

**The app will be ready at:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8001 |
| API Docs (Swagger) | http://localhost:8001/docs |
| API Docs (ReDoc) | http://localhost:8001/redoc |
| Adminer (DB Viewer) | http://localhost:8081 |

Open http://localhost:8080 in your browser and log in with one of the demo accounts below.

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
| Super Admin | admin@example.com | Super admin |
| Alice Nguyen | alice@example.com | Admin |
| Bob Tran | bob@example.com | Admin |
| Eve Adams | eve@example.com | Regular user |
| Grace Hopper | grace@example.com | Regular user |

Use `admin@example.com` / `password123` when you need access to admin-only pages such as Report Management.

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

## Common Commands (via Makefile)

Run `make <target>` from the project root. All Docker operations are automated:

```bash
# Start everything
make dev            # Create .env, start all services, print URLs
make up             # Start all services
make up-build       # Start + rebuild everything from scratch
make down           # Stop all services (keep database data)
make down-volumes   # Stop and destroy database (RESETS all data)

# Logs
make logs           # Tail logs from all services
make logs-backend   # Tail backend logs only
make logs-db        # Tail database logs only

# Single service
make start-backend  make restart-backend  make rebuild-backend
make start-frontend make restart-frontend make rebuild-frontend

# Database
make db-shell       # Open MySQL shell inside the container
make db-reset       # Destroy and recreate DB volume (runs init scripts fresh)
make health         # Check backend /health endpoint

# Show all available targets
make help
```

> **Without Makefile:** replace `make` with `docker compose` (e.g., `docker compose up -d`).

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

## Run Locally Without Docker

Use this mode when you want hot reload for backend/frontend code. The easiest setup is to keep only MySQL in Docker and run FastAPI + Vite on your machine.

### 1. Start MySQL

```bash
cp .env.example .env
docker compose up -d db adminer
```

Wait until the database is healthy:

```bash
docker compose ps
```

### 2. Run the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create backend-local environment file
cp ../.env.example .env
printf "\nDB_HOST=127.0.0.1\nDB_PORT=3307\n" >> .env

# Run FastAPI on port 8000 for the Vite proxy
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend API docs will be at http://localhost:8000/docs.

### 3. Run the Frontend

Open a new terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite will print its local URL, usually http://localhost:5173. The Vite proxy forwards `/api` requests to http://localhost:8000.

### Stop Local Services

```bash
# Stop the local backend/frontend with Ctrl+C in each terminal.
# Stop MySQL/Adminer:
docker compose down
```

To reset the database and re-run all SQL init scripts:

```bash
docker compose down -v
docker compose up -d db adminer
```

---

## Troubleshooting

### `Cannot connect to the Docker daemon`

```
docker: "Cannot connect to the Docker daemon at unix:///Users/.../docker.sock"
```

**Cause:** Docker Desktop is not running.

**Fix:** Open Docker Desktop from Applications, wait ~30 seconds for it to fully start (the menu bar icon should be steady, not animated), then run `make up` again.

### `Access denied` or database connection errors

1. Make sure MySQL is fully started: `docker compose logs db`
2. For local backend development, check `backend/.env` has `DB_HOST=127.0.0.1` and `DB_PORT=3307`. For Docker Compose, the backend container uses `DB_HOST=db` and `DB_PORT=3306`.
3. To completely reset the database:

   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Frontend shows "Network Error" or 404

- Make sure the backend container is healthy before accessing the frontend: `docker compose ps`
- Check backend logs: `docker compose logs backend`
- Verify the backend is responding: http://localhost:8001/health
- If running without Docker, verify the local backend is running at http://localhost:8000/docs because Vite proxies `/api` to port 8000.

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
      - "8083:8080"    # change 8081 to 8083
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
