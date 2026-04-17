"""SQLAlchemy User model (READ-ONLY - for query operations only)."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, Date, Enum, String, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class User(Base):
    """
    SQLAlchemy User model for READ operations only.
    
    WARNING: All WRITE operations (INSERT, UPDATE, DELETE) MUST use
    stored procedures via text("CALL sp_xxx(...)") in the routers.
    """
    __tablename__ = "USERS"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(
        Enum("MALE", "FEMALE", "OTHER", "UNSPECIFIED", name="gender_enum"),
        nullable=True
    )
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<User(user_id={self.user_id}, email='{self.email}')>"
