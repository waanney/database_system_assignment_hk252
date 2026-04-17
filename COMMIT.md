# Commit Groups

## New Files (Untracked)

- `backend/__pycache__/` — Python bytecode cache (should be in .gitignore)
- `backend/auth/__init__.py` — Auth package init
- `backend/auth/__pycache__/` — Python bytecode cache for auth
- `backend/auth/dependencies.py` — Auth dependency injection utilities
- `backend/auth/jwt.py` — JWT token generation and verification
- `backend/config.py` — Application configuration settings
- `backend/database/__init__.py` — Database package init
- `backend/database/__pycache__/` — Python bytecode cache for database
- `backend/database/database_module.py` — Database connection and operations
- `backend/main.py` — FastAPI application entry point
- `backend/models/__init__.py` — Models package init
- `backend/models/__pycache__/` — Python bytecode cache for models
- `backend/models/user.py` — User data model
- `backend/routers/__init__.py` — Routers package init
- `backend/routers/__pycache__/` — Python bytecode cache for routers
- `backend/routers/auth.py` — Authentication API routes
- `backend/routers/comments.py` — Comments API routes
- `backend/routers/friendships.py` — Friendships API routes
- `backend/routers/functions.py` — Stored functions API routes
- `backend/routers/groups.py` — Groups API routes
- `backend/routers/posts.py` — Posts API routes
- `backend/routers/queries.py` — Custom queries API routes
- `backend/routers/reactions.py` — Reactions API routes
- `backend/routers/reports.py` — Reports API routes
- `backend/routers/users.py` — Users API routes
- `backend/schemas/__init__.py` — Schemas package init
- `backend/schemas/__pycache__/` — Python bytecode cache for schemas
- `backend/schemas/auth.py` — Auth request/response schemas
- `backend/schemas/user.py` — User request/response schemas
- `backend/services/__init__.py` — Services package init
- `backend/services/__pycache__/` — Python bytecode cache for services
- `backend/services/user_service.py` — User business logic service
- `frontend/node_modules/.vite/` — Vite build cache
- `frontend/node_modules/@esbuild/darwin-arm64/` — macOS ARM64 esbuild binary
- `frontend/node_modules/@rollup/rollup-darwin-arm64/` — macOS ARM64 rollup binary
- `frontend/node_modules/asynckit/` — Async utility library
- `frontend/node_modules/axios/` — HTTP client library
- `frontend/node_modules/call-bind-apply-helpers/` — Call binding helpers
- `frontend/node_modules/combined-stream/` — Stream combination utility
- `frontend/node_modules/delayed-stream/` — Delayed stream utility
- `frontend/node_modules/dunder-proto/` — Prototype introspection utility
- `frontend/node_modules/es-define-property/` — ES property definition helpers
- `frontend/node_modules/es-errors/` — Error class collection
- `frontend/node_modules/es-object-atoms/` — Object atom utilities
- `frontend/node_modules/es-set-tostringtag/` — Set toStringTag polyfill
- `frontend/node_modules/follow-redirects/` — HTTP redirect following
- `frontend/node_modules/form-data/` — Form data handling
- `frontend/node_modules/fsevents/` — File system events (macOS)
- `frontend/node_modules/get-intrinsic/` — Intrinsic function accessor
- `frontend/node_modules/get-proto/` — Prototype getter
- `frontend/node_modules/gopd/` — Get own property descriptors
- `frontend/node_modules/has-symbols/` — Symbol check utilities
- `frontend/node_modules/has-tostringtag/` — toStringTag check
- `frontend/node_modules/math-intrinsics/` — Math intrinsics helpers
- `frontend/node_modules/mime-db/` — MIME type database
- `frontend/node_modules/mime-types/` — MIME type utilities
- `frontend/node_modules/proxy-from-env/` — Environment proxy support
- `frontend/src/pages/AdminUsersPage.tsx` — Admin user management page
- `frontend/src/pages/AnalyticsPage.tsx` — Analytics dashboard page
- `frontend/src/pages/ReportsPage.tsx` — Reports page
- `frontend/src/pages/UserManagementPage.tsx` — User management page
- `frontend/src/services/` — API service modules
- `rules/` — Project-specific rules

## Modified Files

### Backend
- `backend/database/init/05_stored_query.sql` — Updated stored queries

### Documentation
- `docs/diagrams/Diagram_final.md` — Updated project diagram

### Frontend
- `frontend/index.html` — Updated HTML entry point
- `frontend/package.json` — Updated frontend dependencies
- `frontend/package-lock.json` — Updated dependency lock file
- `frontend/vite.config.ts` — Updated Vite configuration
- `frontend/src/App.tsx` — Updated main app component
- `frontend/src/components/LeftSidebar.tsx` — Updated left sidebar
- `frontend/src/components/Navbar.tsx` — Updated navigation bar
- `frontend/src/components/PostCard.tsx` — Updated post card component
- `frontend/src/components/RightSidebar.tsx` — Updated right sidebar
- `frontend/src/context/AuthContext.tsx` — Updated auth context
- `frontend/src/data/mockData.ts` — Updated mock data
- `frontend/src/pages/FriendsPage.tsx` — Updated friends page
- `frontend/src/pages/GroupDetailPage.tsx` — Updated group detail page
- `frontend/src/pages/GroupsPage.tsx` — Updated groups page
- `frontend/src/pages/LoginPage.tsx` — Updated login page
- `frontend/src/pages/NewsFeedPage.tsx` — Updated news feed page
- `frontend/src/pages/ProfilePage.tsx` — Updated profile page
- `frontend/src/pages/RegisterPage.tsx` — Updated register page

### Frontend Dependencies (node_modules updates)
- `frontend/node_modules/.package-lock.json` — Updated npm lock file
- `frontend/node_modules/.tmp/tsconfig.app.tsbuildinfo` — Updated TypeScript build info

## Deleted Files

### Documentation
- `docs/diagrams/CHANGELOG.md` — Removed old changelog
- `docs/diagrams/Diagram.md` — Removed old diagram v1
- `docs/diagrams/Diagram_v2.md` — Removed old diagram v2
- `docs/diagrams/Diagram_v3.md` — Removed old diagram v3

### Frontend node_modules (Linux binaries removed)
- `frontend/node_modules/@esbuild/linux-x64/README.md` — Removed Linux esbuild
- `frontend/node_modules/@esbuild/linux-x64/bin/esbuild` — Removed Linux esbuild binary
- `frontend/node_modules/@esbuild/linux-x64/package.json` — Removed Linux esbuild package
- `frontend/node_modules/@rollup/rollup-linux-x64-gnu/README.md` — Removed Linux rollup GNU
- `frontend/node_modules/@rollup/rollup-linux-x64-gnu/package.json` — Removed Linux rollup GNU package
- `frontend/node_modules/@rollup/rollup-linux-x64-gnu/rollup.linux-x64-gnu.node` — Removed Linux rollup GNU binary
- `frontend/node_modules/@rollup/rollup-linux-x64-musl/README.md` — Removed Linux rollup musl
- `frontend/node_modules/@rollup/rollup-linux-x64-musl/package.json` — Removed Linux rollup musl package
- `frontend/node_modules/@rollup/rollup-linux-x64-musl/rollup.linux-x64-musl.node` — Removed Linux rollup musl binary
