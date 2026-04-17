"""Database package with connection utilities."""
from .database_module import AsyncSessionLocal, check_connection, engine, get_db, get_db_context

__all__ = [
    "AsyncSessionLocal",
    "check_connection",
    "engine",
    "get_db",
    "get_db_context",
]

# Alias for backwards compatibility
AsyncEngine = type(engine)