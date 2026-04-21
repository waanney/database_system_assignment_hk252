# ============================================================
#  Makefile – Database System Assignment HK252
#  Dùng: make <target>
# ============================================================

.DEFAULT_GOAL := help

# ── Màu sắc terminal ─────────────────────────────────────────
CYAN  := \033[0;36m
GREEN := \033[0;32m
YELLOW:= \033[0;33m
RED   := \033[0;31m
RESET := \033[0m

# ── Help ─────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║         Database System Assignment HK252             ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(GREEN)  Khởi động & Dừng:$(RESET)"
	@echo "    $(YELLOW)make up$(RESET)          – Khởi động tất cả services (giữ DB data)"
	@echo "    $(YELLOW)make build$(RESET)       – Build lại toàn bộ rồi khởi động"
	@echo "    $(YELLOW)make down$(RESET)        – Dừng tất cả services (giữ DB data)"
	@echo "    $(YELLOW)make reset$(RESET)       – Dừng + XÓA data DB + build lại (fresh start)"
	@echo ""
	@echo "$(GREEN)  Hot Reload (code thay đổi, không cần rebuild):$(RESET)"
	@echo "    $(YELLOW)make reload-be$(RESET)   – Reload chỉ backend (Python)"
	@echo "    $(YELLOW)make reload-fe$(RESET)   – Rebuild + reload chỉ frontend (React)"
	@echo "    $(YELLOW)make reload$(RESET)      – Reload cả backend và frontend"
	@echo ""
	@echo "$(GREEN)  Logs:$(RESET)"
	@echo "    $(YELLOW)make logs$(RESET)        – Xem log tất cả services (live)"
	@echo "    $(YELLOW)make logs-be$(RESET)     – Xem log backend"
	@echo "    $(YELLOW)make logs-fe$(RESET)     – Xem log frontend"
	@echo "    $(YELLOW)make logs-db$(RESET)     – Xem log database"
	@echo ""
	@echo "$(GREEN)  Database:$(RESET)"
	@echo "    $(YELLOW)make db-shell$(RESET)    – Mở MySQL shell"
	@echo "    $(YELLOW)make db-import$(RESET)   – Import procedures/triggers/functions vào DB đang chạy"
	@echo "    $(YELLOW)make db-reset$(RESET)    – Xóa DB + khởi động lại (áp dụng SQL mới)"
	@echo ""
	@echo "$(GREEN)  Trạng thái:$(RESET)"
	@echo "    $(YELLOW)make ps$(RESET)          – Xem trạng thái containers"
	@echo "    $(YELLOW)make urls$(RESET)        – In ra các URL của hệ thống"
	@echo ""

# ── Khởi động ────────────────────────────────────────────────
.PHONY: up
up:
	@echo "$(GREEN)▶  Khởi động services...$(RESET)"
	docker compose up -d
	@make --no-print-directory urls

.PHONY: build
build:
	@echo "$(GREEN)▶  Build lại và khởi động...$(RESET)"
	docker compose up -d --build
	@make --no-print-directory urls

# ── Dừng ─────────────────────────────────────────────────────
.PHONY: down
down:
	@echo "$(RED)■  Dừng tất cả services (giữ DB data)...$(RESET)"
	docker compose down

# ── Fresh start (xóa hết data) ───────────────────────────────
.PHONY: reset
reset:
	@echo "$(RED)⚠  XÓA TOÀN BỘ DATA + Build lại từ đầu...$(RESET)"
	docker compose down -v
	docker compose up -d --build
	@make --no-print-directory urls

# ── Hot Reload ───────────────────────────────────────────────
.PHONY: reload-be
reload-be:
	@echo "$(CYAN)🔄  Reload backend (copy code mới vào container)...$(RESET)"
	docker compose up -d --build --no-deps backend
	@echo "$(GREEN)✓  Backend đã reload!$(RESET)"

.PHONY: reload-fe
reload-fe:
	@echo "$(CYAN)🔄  Rebuild + reload frontend...$(RESET)"
	docker compose up -d --build --no-deps frontend
	@echo "$(GREEN)✓  Frontend đã rebuild và reload!$(RESET)"

.PHONY: reload
reload:
	@echo "$(CYAN)🔄  Reload cả backend và frontend...$(RESET)"
	docker compose up -d --build --no-deps backend frontend
	@echo "$(GREEN)✓  Đã reload xong!$(RESET)"
	@make --no-print-directory urls

# ── Logs ─────────────────────────────────────────────────────
.PHONY: logs
logs:
	docker compose logs -f --tail=50

.PHONY: logs-be
logs-be:
	docker compose logs -f --tail=50 backend

.PHONY: logs-fe
logs-fe:
	docker compose logs -f --tail=50 frontend

.PHONY: logs-db
logs-db:
	docker compose logs -f --tail=50 db

# ── Database ─────────────────────────────────────────────────
.PHONY: db-shell
db-shell:
	@echo "$(CYAN)🗄  Mở MySQL shell (dùng 'exit' để thoát)...$(RESET)"
	docker exec -it database_system_assignment_hk252-db-1 \
		mysql -uphobousr -pphobopass PHOBODTB

.PHONY: db-import
db-import:
	@echo "$(CYAN)📥  Import procedures, triggers, functions vào DB đang chạy...$(RESET)"
	docker exec -i database_system_assignment_hk252-db-1 mysql -uroot -prootpassword PHOBODTB < backend/database/init/03_triggers.sql 2>/dev/null || true
	docker exec -i database_system_assignment_hk252-db-1 mysql -uroot -prootpassword PHOBODTB < backend/database/init/04_procedures.sql 2>/dev/null || true
	docker exec -i database_system_assignment_hk252-db-1 mysql -uroot -prootpassword PHOBODTB < backend/database/init/05_stored_query.sql 2>/dev/null || true
	docker exec -i database_system_assignment_hk252-db-1 mysql -uroot -prootpassword PHOBODTB < backend/database/init/06_function.sql 2>/dev/null || true
	@echo "$(GREEN)✓  Import xong!$(RESET)"

.PHONY: db-reset
db-reset:
	@echo "$(RED)⚠  Xóa DB volume và khởi động lại để áp dụng SQL mới...$(RESET)"
	docker compose down -v
	docker compose up -d
	@echo "$(CYAN)⏳  Đợi DB khởi động...$(RESET)"
	@sleep 8
	@echo "$(GREEN)✓  DB đã reset và seed lại!$(RESET)"

# ── Trạng thái ───────────────────────────────────────────────
.PHONY: ps
ps:
	docker compose ps

.PHONY: urls
urls:
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════╗$(RESET)"
	@echo "$(GREEN)║           URLs Hệ Thống              ║$(RESET)"
	@echo "$(GREEN)╠══════════════════════════════════════╣$(RESET)"
	@echo "$(GREEN)║$(RESET)  🌐 Frontend   → http://localhost:8080  $(GREEN)║$(RESET)"
	@echo "$(GREEN)║$(RESET)  ⚡ Backend API → http://localhost:8001  $(GREEN)║$(RESET)"
	@echo "$(GREEN)║$(RESET)  🗄  Adminer    → http://localhost:8081  $(GREEN)║$(RESET)"
	@echo "$(GREEN)╚══════════════════════════════════════╝$(RESET)"
	@echo ""
