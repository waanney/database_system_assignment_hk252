---

name: "Task 3: Application Implementation Plan"
overview: Implement a full-stack web application to connect to the PHOBODTB MySQL database, implementing all three sub-tasks (3.1, 3.2, 3.3) using Python FastAPI backend and React frontend with Tailwind CSS.
todos:

- id: verify-sp
content: "PRE-TEST: Verify stored procedures work correctly in MySQL client (DataGrip/DBeaver)"
status: pending
- id: setup-backend
content: Create backend project structure with FastAPI
status: pending
- id: db-connection
content: Implement async database connection with aiomysql + SQLAlchemy 2.0
status: pending
- id: auth-endpoint
content: Implement JWT authentication endpoint
status: pending
- id: exception-handler
content: Create global exception handler for MySQL errors
status: pending
- id: api-endpoints
content: Create API endpoints calling stored procedures (raw SQL for writes, models for reads)
status: pending
- id: update-auth
content: Update frontend AuthContext with JWT and real API calls
status: pending
- id: crud-interface
content: Implement User Management CRUD interface (3.1)
status: pending
- id: search-interface
content: Implement User List with search/sort/pagination (3.2)
status: pending
- id: function-interface
content: Implement Function demonstration interface (3.3)
status: pending
- id: test-app
content: Test full application with database connection
status: pending
isProject: false

---

# Task 3: Application Implementation Plan

## Tech Stack

### Backend

- **Framework**: Python + FastAPI (async, modern, auto-generated OpenAPI docs)
- **Database Driver**: `aiomysql` (async) - **CRITICAL: NOT mysql-connector-python**
- **ORM**: SQLAlchemy 2.0 with async support
- **Validation**: Pydantic v2
- **Authentication**: JWT (python-jose, passlib)

### Frontend

- **Framework**: React 19 (existing)
- **Styling**: Tailwind CSS (existing)
- **HTTP Client**: Axios
- **State Management**: React Context + Hooks (existing)

### Database

- **DBMS**: MySQL (existing PHOBODTB)

---

## Implementation Plan

### Phase 1: Backend Setup (`backend/`)

**IMPORTANT - Pre-test First**: Before writing any FastAPI code, verify all stored procedures work correctly using a MySQL client (DataGrip/DBeaver/mysql CLI). Most DB assignment errors originate from incorrect SP code, not backend code.

1. **Initialize FastAPI project**
  ```
   backend/
   ├── main.py              # FastAPI app entry point + global exception handlers
   ├── config.py            # Environment config (pydantic-settings)
   ├── database.py          # Async connection pool setup (aiomysql)
   ├── auth/
   │   ├── jwt.py           # JWT token generation/verification
   │   └── dependencies.py  # FastAPI Depends for auth
   ├── models/              # SQLAlchemy models (READ-ONLY usage)
   │   └── user.py
   ├── schemas/             # Pydantic schemas
   │   ├── user.py
   │   └── auth.py
   ├── routers/              # API routes
   │   ├── auth.py          # Login endpoint
   │   ├── users.py         # CRUD endpoints
   │   └── queries.py       # Query procedure endpoints
   └── services/             # Business logic
       └── user_service.py
  ```
2. **Database Connection** (`backend/database.py`)
  - Use `aiomysql` driver (NOT mysql-connector-python)
  - Async connection pool with SQLAlchemy 2.0 AsyncSession
  - Environment-based configuration via pydantic-settings
3. **SQLAlchemy Models** (`backend/models/user.py`)
  - Models used for **READ-ONLY** operations (mapping query results)
  - For WRITE operations (INSERT/UPDATE/DELETE), use raw SQL via `text()`
4. **Global Exception Handler** (`backend/main.py`)
  - Catch `sqlalchemy.exc.IntegrityError` and `sqlalchemy.exc.ProgrammingError`
  - Parse MySQL error messages from SIGNAL SQLSTATE '45000'
  - Return HTTP 400 with readable error messages for frontend
5. **JWT Authentication** (`backend/auth/jwt.py`, `backend/routers/auth.py`)

  | Method | Endpoint             | Purpose                        |
  | ------ | -------------------- | ------------------------------ |
  | POST   | `/api/auth/login`    | Verify credentials, return JWT |
  | POST   | `/api/auth/register` | Call sp_InsertUser             |

  - JWT token contains user_id and roles
  - All subsequent endpoints use `Depends(get_current_user)`
6. **API Endpoints for USERS table** (`backend/routers/users.py`)

  | Method | Endpoint          | Purpose          | Implementation                       |
  | ------ | ----------------- | ---------------- | ------------------------------------ |
  | POST   | `/api/users`      | Create user      | `text("CALL sp_InsertUser(...)")`    |
  | PUT    | `/api/users/{id}` | Update user      | `text("CALL sp_UpdateUser(...)")`    |
  | DELETE | `/api/users/{id}` | Delete user      | `text("CALL sp_DeleteUser(...)")`    |
  | GET    | `/api/users`      | List users       | SQLAlchemy query (with limit/offset) |
  | GET    | `/api/users/{id}` | Get user details | SQLAlchemy query                     |

   **All CRUD endpoints require JWT authentication via `Depends(get_current_user)`**
7. **Pagination for List APIs**
  - Modify `search_user` procedure in MySQL to accept `p_limit` and `p_offset`
  - FastAPI endpoint: `GET /api/users?search=&limit=10&offset=0`
  - Return total count for frontend pagination controls
8. **Query Procedures API** (`backend/routers/queries.py`)
  - `GET /api/friends/search?u_id=&cmp=&cmp_date=` → `search_friend`
  - `GET /api/groups/{id}/members` → `get_group_members`
  - `GET /api/groups/verified?date=` → `count_ver_group`
9. **Function API** (`backend/routers/functions.py`)
  - `GET /api/users/{id1}/mutual-friends/{id2}` → `get_mutual_friends_count`
  - `GET /api/posts/{id}/reaction-score` → `get_post_reaction_weighted_score`
  - `GET /api/groups/{id}/qualified-members?min_posts=` → `count_group_members_with_min_public_posts`

---

### Phase 2: Frontend Integration

1. **API Service Layer** (`frontend/src/services/api.ts`)
  ```typescript
   // Centralized API client
   const API_BASE = '/api'
   export const userApi = { create, update, delete, search }
   export const queryApi = { searchFriends, getGroupMembers, ... }
   export const functionApi = { getMutualFriends, getReactionScore, ... }
  ```
2. **Update AuthContext** (`frontend/src/context/AuthContext.tsx`)
  - Replace mock data with real API calls
  - Login/Register now call FastAPI endpoints
3. **Update RegisterPage** (`frontend/src/pages/RegisterPage.tsx`)
  - Call `POST /api/users` instead of mock submission
  - Display validation errors from stored procedures

---

### Phase 3: Interface Implementation

#### 3.1 User Management Interface (`frontend/src/pages/AdminUsersPage.tsx`)

Features:

- **Create User**: Modal form calling `sp_InsertUser`
- **Edit User**: Modal form calling `sp_UpdateUser`
- **Delete User**: Confirmation dialog calling `sp_DeleteUser`
- **Validation Display**: Show meaningful error messages from backend
  - "Invalid email."
  - "User must be at least 18 years old."
  - "Cannot delete a SUPER admin user."

#### 3.2 User List with Search/Sort (`frontend/src/pages/UserManagementPage.tsx`)

Features:

- **Data Table**: Display users from `search_user` procedure
- **Search**: Text input calling procedure with LIKE
- **Sorting**: Client-side or procedure parameter
- **Inline Actions**: Edit/Delete buttons on each row
- **Validation**: Real-time input validation
- **Error Handling**: Toast notifications for operation results

#### 3.3 Function Demonstration Interface (`frontend/src/pages/AnalyticsPage.tsx`)

Features:

- **Mutual Friends Calculator**: Select two users, display mutual friend count
- **Post Reaction Score**: Display weighted reaction score for posts
- **Group Analytics**: Show qualified members based on post count

---

### Phase 4: Connection Verification

1. **Environment Configuration** (`frontend/.env`, `backend/.env`)
  ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=PHOBODTB
  ```
2. **Startup Scripts**
  - Backend: `uvicorn main:app --reload --port 8000`
  - Frontend: `npm run dev` (Vite proxy to backend)

---

## File Structure Summary

```
database_system_assignment_hk252/
├── backend/
│   ├── main.py              # FastAPI app + global exception handlers
│   ├── config.py           # Environment config (pydantic-settings)
│   ├── database.py         # Async MySQL connection (aiomysql)
│   ├── requirements.txt    # Python dependencies
│   ├── auth/
│   │   ├── jwt.py          # JWT token generation/verification
│   │   └── dependencies.py  # FastAPI Depends for auth
│   ├── models/
│   │   └── user.py          # SQLAlchemy User model (READ-ONLY)
│   ├── schemas/
│   │   ├── user.py          # User Pydantic schemas
│   │   └── auth.py          # Auth Pydantic schemas
│   ├── routers/
│   │   ├── auth.py          # Login/Register endpoints
│   │   ├── users.py         # CRUD endpoints (JWT protected)
│   │   ├── queries.py       # Query procedure endpoints
│   │   └── functions.py     # Function endpoints
│   └── services/
│       └── user_service.py  # Business logic
│
└── frontend/
    └── src/
        ├── services/
        │   └── api.ts       # Axios API client
        ├── context/
        │   └── AuthContext.tsx  # JWT auth state
        └── pages/
            ├── LoginPage.tsx         # Updated with API
            ├── RegisterPage.tsx       # Updated
            ├── AdminUsersPage.tsx    # 3.1 - CRUD interface
            ├── UserManagementPage.tsx # 3.2 - List with search
            └── AnalyticsPage.tsx     # 3.3 - Function demos
```

---

## Dependencies to Install

**Backend (`backend/requirements.txt`)**:

```
# Core
fastapi>=0.100.0
uvicorn[standard]>=0.23.0

# Database - MUST use aiomysql for async support
sqlalchemy[asyncio]>=2.0.0
aiomysql>=0.2.0

# Validation
pydantic>=2.0.0
pydantic-settings>=2.0.0

# Authentication
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6  # For form data in login
```

**Frontend** (already installed):

- React 19, Tailwind CSS, TypeScript (existing)
- Add: `axios` for HTTP client

---