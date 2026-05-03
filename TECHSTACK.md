# Tech Stack

## Overview

This is a full-stack social network application (Facebook mockup) built for a Database Systems course (HK252).

---

## Backend


| Technology           | Version    | Purpose                    |
| -------------------- | ---------- | -------------------------- |
| **Python**           | 3.13       | Programming language       |
| **FastAPI**          | >= 0.100.0 | Web framework              |
| **Uvicorn**          | >= 0.23.0  | ASGI server                |
| **SQLAlchemy**       | >= 2.0.0   | ORM (async)                |
| **aiomysql**         | >= 0.2.0   | Async MySQL driver         |
| **Pydantic**         | >= 2.0.0   | Data validation & settings |
| **python-jose**      | >= 3.3.0   | JWT token handling         |
| **bcrypt**           | latest     | Password hashing           |
| **python-multipart** | >= 0.0.6   | Form data parsing          |


### Database


| Technology            | Purpose              |
| --------------------- | -------------------- |
| **MySQL**             | Relational database  |
| **Stored Procedures** | Business logic in DB |
| **Triggers**          | Automated actions    |
| **MySQL Functions**   | Complex queries      |


---

## Frontend


| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| **React**        | 19.1.0  | UI framework            |
| **TypeScript**   | 5.8.3   | Type-safe JavaScript    |
| **Vite**         | 6.3.1   | Build tool & dev server |
| **Tailwind CSS** | 3.4.17  | Utility-first CSS       |
| **Axios**        | 1.7.9   | HTTP client             |
| **React Router** | 7.5.1   | Client-side routing     |
| **PostCSS**      | 8.5.3   | CSS processing          |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixes     |


---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │──────│  Frontend   │──────│   Backend  │
│   (React)   │      │   (Vite)    │      │  (FastAPI) │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │    MySQL    │
                                          │  Database   │
                                          └─────────────┘
```

---

## External Image Services


| Service          | URL                                              | Purpose             |
| ---------------- | ------------------------------------------------ | ------------------- |
| **Lorem Picsum** | [https://picsum.photos](https://picsum.photos)   | Post & cover images |
| **Pravatar**     | [https://i.pravatar.cc](https://i.pravatar.cc)   | User avatars        |
| **UI Avatars**   | [https://ui-avatars.com](https://ui-avatars.com) | Fallback avatars    |


---

## Development Ports


| Service      | Port |
| ------------ | ---- |
| Backend API  | 8000 |
| Frontend Dev | 5173 |
| MySQL        | 3306 |


---

## Key Features Implemented

- User authentication (JWT)
- CRUD operations via stored procedures
- Complex database queries (functions)
- Database triggers for automation
- RESTful API design
- Responsive UI with Tailwind CSS

