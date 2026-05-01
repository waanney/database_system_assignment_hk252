# ─────────────────────────────────────────────
# PHOBODTB — Makefile
# ─────────────────────────────────────────────

# Default target
.DEFAULT_GOAL := help

# ─── Variables ───────────────────────────────

COMPOSE   := docker compose
COMPOSE_V := $(COMPOSE) -f docker-compose.yml
ENV_FILE  := .env
ENV_EX    := .env.example

# Services
SERVICES  := db adminer backend frontend
BACKEND   := backend
FRONTEND  := frontend
DB        := db

# ─── Colours ─────────────────────────────────

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
RESET  := \033[0m

# ─── Helpers ──────────────────────────────────

define print
	@printf "$(GREEN)==>$(RESET) $(1)\n"
endef

define warn
	@printf "$(YELLOW)WARNING:$(RESET) $(1)\n"
endef

define section
	@printf "\n${GREEN}===$(RESET} $(1) ${GREEN}===${RESET}\n"
endef

# ─── Targets ──────────────────────────────────

## Setup ──────────────────────────────────────

.PHONY: setup
setup: ## Create .env from .env.example and pull latest code
	@$(call section,Setup)
	@if [ ! -f $(ENV_FILE) ]; then \
		cp $(ENV_EX) $(ENV_FILE); \
		$(call print,"Created $(ENV_FILE) from $(ENV_EX)"); \
	else \
		$(call warn,"$(ENV_FILE) already exists — skipping"); \
	fi

## Docker ─────────────────────────────────────

.PHONY: up
up: ## Start all services (background)
	@$(call section,Starting all services)
	$(COMPOSE_V) up -d
	@$(call print,"All services started")
	@$(call print,"Wait ~20s for MySQL to init, then check: $(MAKE) status")

.PHONY: up-build
up-build: ## Start all services with a fresh build
	@$(call section,Building & starting all services)
	$(COMPOSE_V) up -d --build
	@$(call print,"All services built and started")

.PHONY: down
down: ## Stop all services (keep data volume)
	@$(call section,Stopping all services)
	$(COMPOSE_V) down

.PHONY: down-volumes
down-volumes: ## Stop all services and destroy database volume (RESETS data)
	@$(call section,Stopping and destroying volumes)
	$(COMPOSE_V) down -v
	@$(call print,"All services stopped and volumes destroyed")

.PHONY: restart
restart: down up ## Stop then start all services

.PHONY: rebuild
rebuild: ## Rebuild all services without stopping
	@$(call section,Rebuilding all services)
	$(COMPOSE_V) up -d --build

.PHONY: clean
clean: down-volumes ## Alias for down-volumes (alias)

## Status & Logs ──────────────────────────────

.PHONY: status
status: ## Show status of all containers
	$(COMPOSE_V) ps

.PHONY: logs
logs: ## Tail logs from all services
	$(COMPOSE_V) logs -f

.PHONY: logs-backend
logs-backend: ## Tail backend logs
	$(COMPOSE_V) logs -f $(BACKEND)

.PHONY: logs-db
logs-db: ## Tail database logs
	$(COMPOSE_V) logs -f $(DB)

.PHONY: logs-frontend
logs-frontend: ## Tail frontend logs
	$(COMPOSE_V) logs -f $(FRONTEND)

.PHONY: health
health: ## Check backend health and database connection
	@$(call section,Health check)
	@curl -s http://localhost:8001/health | python3 -m json.tool 2>/dev/null || \
		$(call warn,"Backend not responding on http://localhost:8001")

## Database ───────────────────────────────────

.PHONY: db-shell
db-shell: ## Open MySQL shell inside the db container
	$(COMPOSE_V) exec $(DB) mysql -u phobousr -pphobopass PHOBODTB

.PHONY: db-reset
db-reset: ## Destroy and recreate database volume (runs init scripts again)
	@$(call section,Resetting database)
	$(COMPOSE_V) down -v
	$(COMPOSE_V) up -d
	@$(call print,"Database volume destroyed and recreated")
	@$(call print,"Init scripts will re-run on next MySQL startup")

## Single service ─────────────────────────────

.PHONY: start-db
start-db: ## Start only the database
	$(COMPOSE_V) up -d $(DB)

.PHONY: start-backend
start-backend: ## Start only the backend
	$(COMPOSE_V) up -d $(BACKEND)

.PHONY: start-frontend
start-frontend: ## Start only the frontend
	$(COMPOSE_V) up -d $(FRONTEND)

.PHONY: restart-backend
restart-backend: ## Restart backend container
	$(COMPOSE_V) restart $(BACKEND)

.PHONY: restart-frontend
restart-frontend: ## Restart frontend container
	$(COMPOSE_V) restart $(FRONTEND)

.PHONY: rebuild-backend
rebuild-backend: ## Rebuild backend container
	$(COMPOSE_V) build $(BACKEND)
	$(COMPOSE_V) up -d $(BACKEND)

.PHONY: rebuild-frontend
rebuild-frontend: ## Rebuild frontend container
	$(COMPOSE_V) build $(FRONTEND)
	$(COMPOSE_V) up -d $(FRONTEND)

## Backend (non-Docker local dev) ─────────────

.PHONY: backend-install
backend-install: ## Install Python dependencies for local dev
	cd $(BACKEND) && pip install -r requirements.txt

.PHONY: backend-run
backend-run: ## Run backend locally (requires MySQL running)
	cd $(BACKEND) && python -m uvicorn main:app --reload --port 8001

.PHONY: backend-shell
backend-shell: ## Open a shell inside the backend container
	$(COMPOSE_V) exec $(BACKEND) /bin/sh

## Frontend (non-Docker local dev) ───────────

.PHONY: frontend-install
frontend-install: ## Install Node dependencies
	cd $(FRONTEND) && npm install

.PHONY: frontend-dev
frontend-dev: ## Run Vite dev server locally (proxies /api to localhost:8000)
	cd $(FRONTEND) && npm run dev

.PHONY: frontend-build
frontend-build: ## Build frontend for production
	cd $(FRONTEND) && npm run build

## URLs ────────────────────────────────────────

.PHONY: urls
urls: ## Print all service URLs
	@$(call section,Service URLs)
	@printf "  Frontend:   ${GREEN}http://localhost:8080${RESET}\n"
	@printf "  Backend:    ${GREEN}http://localhost:8001${RESET}\n"
	@printf "  API Docs:   ${GREEN}http://localhost:8001/docs${RESET}\n"
	@printf "  Adminer:    ${GREEN}http://localhost:8081${RESET}\n"

## Dev helpers ───────────────────────────────

.PHONY: dev
dev: setup up urls ## Full local setup: create .env, start all services, show URLs

.PHONY: dev-reset
dev-reset: down-volumes setup up urls ## Reset everything: destroy DB, recreate .env, start

## Git ────────────────────────────────────────

.PHONY: push
push: ## Commit all changes and push to origin hieu
	git add -A && git commit && git push origin hieu

## Cleanup ────────────────────────────────────

.PHONY: prune
prune: ## Remove all stopped containers, unused networks, and dangling images
	docker system prune -f

.PHONY: deep-clean
deep-clean: down-volumes prune ## Full cleanup: stop everything, destroy volumes, prune Docker

## Help ───────────────────────────────────────

.PHONY: help
help:
	@printf "\n${GREEN}PHOBODTB — Available targets:${RESET}\n\n"
	@printf "${GREEN}  Quick start:${RESET}\n"
	@printf "    make dev          Full setup: create .env, start all services, show URLs\n"
	@printf "    make up           Start all services (background)\n"
	@printf "    make up-build     Start with a fresh build\n"
	@printf "    make down         Stop all services (keep data)\n"
	@printf "    make down-volumes Stop and destroy database (RESETS data)\n"
	@printf "\n${GREEN}  Logs:${RESET}\n"
	@printf "    make logs              All services\n"
	@printf "    make logs-backend      Backend only\n"
	@printf "    make logs-db           Database only\n"
	@printf "    make logs-frontend    Frontend only\n"
	@printf "\n${GREEN}  Single service:${RESET}\n"
	@printf "    make start-db/start-backend/start-frontend\n"
	@printf "    make restart-backend/restart-frontend\n"
	@printf "    make rebuild-backend/rebuild-frontend\n"
	@printf "\n${GREEN}  Database:${RESET}\n"
	@printf "    make db-shell    Open MySQL shell\n"
	@printf "    make db-reset    Destroy and recreate DB volume\n"
	@printf "    make health      Check backend /health endpoint\n"
	@printf "\n${GREEN}  Local dev (no Docker):${RESET}\n"
	@printf "    make backend-install   pip install -r requirements.txt\n"
	@printf "    make backend-run       python -m uvicorn main:app --reload\n"
	@printf "    make frontend-install  npm install\n"
	@printf "    make frontend-dev      npm run dev (with Vite proxy)\n"
	@printf "\n${GREEN}  Misc:${RESET}\n"
	@printf "    make urls       Print all service URLs\n"
	@printf "    make push       Commit and git push origin hieu\n"
	@printf "    make prune      Remove stopped containers & dangling images\n"
	@printf "    make deep-clean Full reset: destroy volumes + prune Docker\n"
	@printf "\n"
