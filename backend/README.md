# PHOBODTB Backend API

FastAPI backend for the PHOBODTB social network application.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=PHOBODTB
SECRET_KEY=your_secret_key_here_generate_a_strong_random_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Start the Server

```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

### 4. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/register` | Register new user |

### Users (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (paginated) |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Queries (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends/search` | Search friends |
| GET | `/api/groups/{id}/members` | Get group members |
| GET | `/api/groups/verified` | Count verified groups |

### Functions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/{id1}/mutual-friends/{id2}` | Get mutual friends count |
| GET | `/api/posts/{id}/reaction-score` | Get post reaction score |
| GET | `/api/groups/{id}/qualified-members` | Get qualified group members |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API and database health |
| GET | `/` | Welcome message |

## Project Structure

```
backend/
├── main.py              # FastAPI app + global exception handlers
├── config.py            # Environment config (pydantic-settings)
├── database.py          # Async MySQL connection (aiomysql)
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── auth/
│   ├── jwt.py          # JWT token generation/verification
│   └── dependencies.py  # FastAPI Depends for auth
├── models/
│   └── user.py          # SQLAlchemy User model (READ-ONLY)
├── schemas/
│   ├── user.py          # User Pydantic schemas
│   └── auth.py          # Auth Pydantic schemas
├── routers/
│   ├── auth.py          # Login/Register endpoints
│   ├── users.py         # CRUD endpoints
│   ├── queries.py       # Query procedure endpoints
│   └── functions.py     # Function endpoints
└── services/
    └── user_service.py  # Business logic
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### Login Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/users?limit=10&offset=0
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Database Error",
  "detail": "Duplicate entry for email",
  "sql_state": "23000"
}
```

Custom business rule violations (SQLSTATE 45000) return:

```json
{
  "error": "Business Rule Violation",
  "detail": "User must be at least 18 years old",
  "sql_state": "45000"
}
```

## Database

- **Driver**: aiomysql (async MySQL driver)
- **ORM**: SQLAlchemy (read operations only)
- **Procedures**: All write operations use stored procedures

### Required Stored Procedures

The following stored procedures must exist in the database:

- `sp_InsertUser(...)` - Insert new user
- `sp_UpdateUser(...)` - Update existing user
- `sp_DeleteUser(...)` - Delete user
- `search_friend(...)` - Search friends
- `get_group_members(...)` - Get group members
- `count_ver_group(...)` - Count verified groups
