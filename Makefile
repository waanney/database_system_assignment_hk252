# ─────────────────────────────────────────────
# PHOBODTB — Makefile
# ─────────────────────────────────────────────

.DEFAULT_GOAL := help

# ─── Variables ───────────────────────────────

COMPOSE   := docker compose
COMPOSE_V := $(COMPOSE) -f docker-compose.yml
ENV_FILE  := .env
ENV_EX    := .env.example
BACKEND   := backend
FRONTEND  := frontend
DB        := db

# ─── Colours ─────────────────────────────────

ESC := \033
GREEN  := $(ESC)[0;32m
YELLOW := $(ESC)[0;33m
RED    := $(ESC)[0;31m
RESET  := $(ESC)[0m

# ─── Targets ──────────────────────────────────

## Setup ──────────────────────────────────────

setup: ## Create .env from .env.example
	@printf "\n$(GREEN)== Setup ==$(RESET)\n"
	@if [ ! -f $(ENV_FILE) ]; then \
		cp $(ENV_EX) $(ENV_FILE); \
		printf "$(GREEN)==>$(RESET) Created $(ENV_FILE)\n"; \
	else \
		printf "$(YELLOW)==>$(RESET) $(ENV_FILE) already exists — skipping\n"; \
	fi

## Docker ─────────────────────────────────────

up: ## Start all services (background)
	@printf "\n$(GREEN)== Starting all services ==$(RESET)\n"
	$(COMPOSE_V) up -d
	@printf "$(GREEN)==>$(RESET) All services started\n"
	@printf "$(GREEN)==>$(RESET) Wait ~20s for MySQL, then run: make status\n"

up-build: ## Start all services with a fresh build
	@printf "\n$(GREEN)== Building & starting all services ==$(RESET)\n"
	$(COMPOSE_V) up -d --build
	@printf "$(GREEN)==>$(RESET) All services built and started\n"

down: ## Stop all services (keep data volume)
	@printf "\n$(GREEN)== Stopping all services ==$(RESET)\n"
	$(COMPOSE_V) down

down-volumes: ## Stop and destroy database volume (RESETS data)
	@printf "\n$(GREEN)== Destroying volumes ==$(RESET)\n"
	$(COMPOSE_V) down -v
	@printf "$(GREEN)==>$(RESET) All services stopped and volumes destroyed\n"

restart: down up ## Stop then start all services
rebuild: ## Rebuild all services without stopping
	@printf "\n$(GREEN)== Rebuilding all services ==$(RESET)\n"
	$(COMPOSE_V) up -d --build

clean: down-volumes ## Alias for down-volumes

## Status & Logs ──────────────────────────────

status: ## Show status of all containers
	$(COMPOSE_V) ps

logs: ## Tail logs from all services
	$(COMPOSE_V) logs -f

logs-backend: ## Tail backend logs
	$(COMPOSE_V) logs -f $(BACKEND)

logs-db: ## Tail database logs
	$(COMPOSE_V) logs -f $(DB)

logs-frontend: ## Tail frontend logs
	$(COMPOSE_V) logs -f $(FRONTEND)

health: ## Check backend /health endpoint
	@printf "\n$(GREEN)== Health check ==$(RESET)\n"
	@curl -s http://localhost:8001/health | python3 -m json.tool 2>/dev/null || \
		printf "$(YELLOW)==>$(RESET) Backend not responding on http://localhost:8001\n"

## Database ───────────────────────────────────

db-shell: ## Open MySQL shell inside the container
	$(COMPOSE_V) exec $(DB) mysql -u phobousr -pphobopass PHOBODTB

db-reset: ## Destroy and recreate database volume
	@printf "\n$(GREEN)== Resetting database ==$(RESET)\n"
	$(COMPOSE_V) down -v
	$(COMPOSE_V) up -d
	@printf "$(GREEN)==>$(RESET) Database volume destroyed and recreated\n"
	@printf "$(GREEN)==>$(RESET) Init scripts will re-run on next MySQL startup\n"

## Single service ─────────────────────────────

start-db: ## Start only the database
	$(COMPOSE_V) up -d $(DB)

start-backend: ## Start only the backend
	$(COMPOSE_V) up -d $(BACKEND)

start-frontend: ## Start only the frontend
	$(COMPOSE_V) up -d $(FRONTEND)

restart-backend: ## Restart backend container
	$(COMPOSE_V) restart $(BACKEND)

restart-frontend: ## Restart frontend container
	$(COMPOSE_V) restart $(FRONTEND)

rebuild-backend: ## Rebuild backend container
	$(COMPOSE_V) build $(BACKEND) && $(COMPOSE_V) up -d $(BACKEND)

rebuild-frontend: ## Rebuild frontend container
	$(COMPOSE_V) build $(FRONTEND) && $(COMPOSE_V) up -d $(FRONTEND)

## Backend (non-Docker local dev) ─────────────

backend-install: ## Install Python dependencies
	cd $(BACKEND) && pip install -r requirements.txt

backend-run: ## Run backend locally (requires MySQL running)
	cd $(BACKEND) && python -m uvicorn main:app --reload --port 8001

backend-shell: ## Shell into backend container
	$(COMPOSE_V) exec $(BACKEND) /bin/sh

## Frontend (non-Docker local dev) ───────────

frontend-install: ## Install Node dependencies
	cd $(FRONTEND) && npm install

frontend-dev: ## Run Vite dev server (proxies /api to localhost:8000)
	cd $(FRONTEND) && npm run dev

frontend-build: ## Build frontend for production
	cd $(FRONTEND) && npm run build

## URLs ────────────────────────────────────────

.PHONY: urls
urls: ## Print all service URLs
	@printf "\n$(GREEN)== Service URLs ==$(RESET)\n"
	@printf "  Frontend:   $(GREEN)http://localhost:8080$(RESET)\n"
	@printf "  Backend:    $(GREEN)http://localhost:8001$(RESET)\n"
	@printf "  API Docs:   $(GREEN)http://localhost:8001/docs$(RESET)\n"
	@printf "  Adminer:    $(GREEN)http://localhost:8081$(RESET)\n"

## Dev helpers ───────────────────────────────

dev: setup up urls ## Full setup: create .env, start services, show URLs

dev-reset: down-volumes setup up urls ## Reset everything: destroy DB, recreate .env, start

## Git ────────────────────────────────────────

push: ## Commit all changes and push to origin hieu
	git add -A && git commit && git push origin hieu

## Cleanup ────────────────────────────────────

prune: ## Remove stopped containers and dangling images
	docker system prune -f

deep-clean: down-volumes prune ## Full reset: destroy volumes + prune Docker

## Help ───────────────────────────────────────

help:
	@printf "\n$(GREEN)PHOBODTB — Available targets$(RESET)\n\n"
	@printf "$(GREEN)  Quick start:${RESET}\n"
	@printf "    make dev           Full setup: .env + start + URLs\n"
	@printf "    make up            Start all services\n"
	@printf "    make up-build      Start + rebuild from scratch\n"
	@printf "    make down          Stop all (keep data)\n"
	@printf "    make down-volumes Stop + destroy DB (RESETS data)\n"
	@printf "\n$(GREEN)  Logs:${RESET}\n"
	@printf "    make logs              All services\n"
	@printf "    make logs-backend     Backend only\n"
	@printf "    make logs-db          Database only\n"
	@printf "    make logs-frontend    Frontend only\n"
	@printf "\n$(GREEN)  Single service:${RESET}\n"
	@printf "    make start-db/start-backend/start-frontend\n"
	@printf "    make restart-backend/restart-frontend\n"
	@printf "    make rebuild-backend/rebuild-frontend\n"
	@printf "\n$(GREEN)  Database:${RESET}\n"
	@printf "    make db-shell    MySQL shell\n"
	@printf "    make db-reset    Destroy + recreate DB volume\n"
	@printf "    make health      Check /health endpoint\n"
	@printf "\n$(GREEN)  Local dev (no Docker):${RESET}\n"
	@printf "    make backend-install   pip install\n"
	@printf "    make backend-run       uvicorn --reload\n"
	@printf "    make frontend-install  npm install\n"
	@printf "    make frontend-dev      npm run dev\n"
	@printf "\n$(GREEN)  Misc:${RESET}\n"
	@printf "    make urls       Print all URLs\n"
	@printf "    make push       Commit + git push origin hieu\n"
	@printf "    make prune      Remove dangling Docker images\n"
	@printf "    make deep-clean Destroy volumes + prune Docker\n"
	@printf "\n"
