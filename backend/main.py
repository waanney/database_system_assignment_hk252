"""FastAPI application with global exception handlers."""
import re
from contextlib import asynccontextmanager
from typing import Union

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import get_settings
from database import check_connection
from routers import auth, functions, friendships, groups, posts, queries, users, comments, reactions, reports

settings = get_settings()


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    error: str
    detail: str | None = None
    error_code: str | None = None


class MySQLErrorResponse(BaseModel):
    """MySQL error response schema."""
    error: str
    detail: str
    sql_state: str | None = None


def parse_mysql_error_message(error_str: str) -> tuple[str, str | None]:
    """
    Parse MySQL error message to extract user-friendly message.
    
    Args:
        error_str: Raw MySQL error string
        
    Returns:
        Tuple of (user_message, sql_state)
    """
    # Extract SQLSTATE
    sql_state_match = re.search(r'SQLSTATE\[(\w+)\]', error_str)
    sql_state = sql_state_match.group(1) if sql_state_match else None
    
    # Extract error message (text after the main error)
    # Common patterns: "(conn_\d+)" or specific error codes
    message_match = re.search(r'\]\s*(.+?)(?:\s*\($|$)', error_str)
    
    if message_match:
        raw_message = message_match.group(1).strip()
    else:
        raw_message = error_str
    
    # Clean up the message
    if "Duplicate entry" in raw_message:
        return "A record with this value already exists", sql_state
    
    if "Cannot delete or update" in raw_message:
        return "Cannot delete or update this record due to existing dependencies", sql_state
    
    if "foreign key constraint fails" in raw_message.lower():
        return "This operation is not allowed due to existing related records", sql_state
    
    # Return the cleaned message
    return raw_message, sql_state


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    print("Starting PHOBODTB API...")
    
    # Check database connection
    db_connected = await check_connection()
    if db_connected:
        print("Database connection: OK")
    else:
        print("Database connection: FAILED - Please check your database settings")
    
    yield
    
    # Shutdown
    print("Shutting down PHOBODTB API...")


# Create FastAPI application
app = FastAPI(
    title="PHOBODTB API",
    description="Backend API for PHOBODTB Social Network Application",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException
) -> JSONResponse:
    """
    Handle HTTP exceptions.
    
    Args:
        request: FastAPI request
        exc: HTTP exception
        
    Returns:
        JSON response with error details
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTP Error",
            detail=exc.detail,
            error_code=f"HTTP_{exc.status_code}"
        ).model_dump(exclude_none=True),
        headers=exc.headers if hasattr(exc, "headers") else None
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handle general exceptions.
    
    Args:
        request: FastAPI request
        exc: Exception
        
    Returns:
        JSON response with error details
    """
    error_str = str(exc)
    
    # Check for MySQL-specific errors
    if "MySQL" in error_str or "aiomysql" in error_str or "SQLSTATE" in error_str:
        user_message, sql_state = parse_mysql_error_message(error_str)
        
        # Check for custom trigger/procedure error (SQLSTATE 45000)
        if sql_state == "45000":
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=MySQLErrorResponse(
                    error="Business Rule Violation",
                    detail=user_message,
                    sql_state=sql_state
                ).model_dump(exclude_none=True)
            )
        
        # Other MySQL errors
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=MySQLErrorResponse(
                error="Database Error",
                detail=user_message,
                sql_state=sql_state
            ).model_dump(exclude_none=True)
        )
    
    # Generic error
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail="An unexpected error occurred"
        ).model_dump(exclude_none=True)
    )


# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(friendships.router)
app.include_router(groups.router)
app.include_router(queries.router)
app.include_router(functions.router)
app.include_router(comments.router)
app.include_router(reactions.router)
app.include_router(reports.router)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """
    Health check endpoint.
    
    Returns:
        Health status and database connection status
    """
    db_connected = await check_connection()
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> dict:
    """
    Root endpoint.
    
    Returns:
        Welcome message and API information
    """
    return {
        "message": "Welcome to PHOBODTB API",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": "1.0.0"
    }


# Run with uvicorn (for development)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="[IP_ADDRESS]",
        port=8001,
        reload=True,
        log_level="info"
    )
