"""User service with business logic for user operations."""
from datetime import date
from typing import Optional

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from auth.jwt import hash_password, verify_password
from models.user import User
from schemas.user import UserCreate, UserResponse, UserUpdate


class UserService:
    """Service class for user-related operations."""
    
    def __init__(self, db: AsyncSession):
        """Initialize with database session."""
        self.db = db
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get a user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get a user by email.
        
        Args:
            email: User email
            
        Returns:
            User object or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_users_paginated(
        self,
        limit: int = 10,
        offset: int = 0,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        """
        Get paginated list of users, optionally filtered by search term.

        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip
            search: Optional search term to filter users by name

        Returns:
            Tuple of (users list, total count)
        """
        if search:
            # Use search_user stored procedure
            result = await self.db.execute(
                text("CALL search_user(:p_search_term)"),
                {"p_search_term": search}
            )
            rows = result.fetchall()
            columns = [key.lower() for key in result.keys()]
            user_id_index = columns.index("user_id")
            user_ids = [row[user_id_index] for row in rows]

            total = len(user_ids)
            paginated_ids = user_ids[offset:offset + limit]

            if not paginated_ids:
                return [], total

            users_result = await self.db.execute(
                select(User).where(User.user_id.in_(paginated_ids))
            )
            users = list(users_result.scalars().all())
            users_by_id = {user.user_id: user for user in users}
            users = [users_by_id[user_id] for user_id in paginated_ids if user_id in users_by_id]
            return users, total

        # Get total count
        count_result = await self.db.execute(select(func.count(User.user_id)))
        total = count_result.scalar() or 0

        # Get paginated users
        result = await self.db.execute(
            select(User)
            .order_by(User.user_id)
            .limit(limit)
            .offset(offset)
        )
        users = list(result.scalars().all())

        return users, total
    
    async def create_user(self, user_data: UserCreate) -> dict:
        """
        Create a new user using stored procedure.
        
        Args:
            user_data: User creation data
            
        Returns:
            Dictionary with creation result
        """
        hashed_password = hash_password(user_data.password)
        
        # Call stored procedure
        # Parameter order: p_email, p_phone_number, p_password_hash, p_first_name, p_last_name, p_gender, p_date_of_birth
        procedure_call = text("""
            CALL sp_InsertUser(
                :p_email,
                :p_phone_number,
                :p_password_hash,
                :p_first_name,
                :p_last_name,
                :p_gender,
                :p_date_of_birth
            )
        """)
        
        params = {
            "p_email": user_data.email,
            "p_phone_number": user_data.phone_number or "0000000000",
            "p_password_hash": hashed_password,
            "p_first_name": user_data.first_name,
            "p_last_name": user_data.last_name,
            "p_gender": user_data.gender.value if user_data.gender else "UNSPECIFIED",
            "p_date_of_birth": str(user_data.date_of_birth) if user_data.date_of_birth else None
        }
        
        await self.db.execute(procedure_call, params)
        await self.db.commit()

        return {"message": "User created successfully"}
    
    async def update_user(self, user_id: int, user_data: UserUpdate) -> dict:
        """
        Update an existing user using stored procedure.
        
        Args:
            user_id: User ID to update
            user_data: User update data
            
        Returns:
            Dictionary with update result
        """
        from sqlalchemy import text
        
        params = {
            "p_user_id": user_id,
            "p_email": user_data.email,
            "p_phone_number": user_data.phone_number,
            "p_password_hash": None,
            "p_first_name": user_data.first_name,
            "p_last_name": user_data.last_name,
            "p_gender": user_data.gender.value if user_data.gender else None,
            "p_date_of_birth": str(user_data.date_of_birth) if user_data.date_of_birth else None,
        }
        
        procedure_call = text("""
            CALL sp_UpdateUser(
                :p_user_id,
                :p_email,
                :p_phone_number,
                :p_password_hash,
                :p_first_name,
                :p_last_name,
                :p_gender,
                :p_date_of_birth
            )
        """)
        
        await self.db.execute(procedure_call, params)
        if user_data.is_active is not None:
            await self.db.execute(
                text("UPDATE USERS SET is_active = :is_active WHERE user_id = :user_id"),
                {"is_active": user_data.is_active, "user_id": user_id}
            )
        
        return {"message": "User updated successfully"}
    
    async def delete_user(self, user_id: int) -> dict:
        """
        Delete a user using stored procedure.
        
        Args:
            user_id: User ID to delete
            
        Returns:
            Dictionary with deletion result
        """
        from sqlalchemy import text
        
        procedure_call = text("CALL sp_DeleteUser(:p_user_id)")
        
        await self.db.execute(procedure_call, {"p_user_id": user_id})
        
        return {"message": "User deleted successfully"}
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user by email and password.
        
        Args:
            email: User email
            password: Plain password
            
        Returns:
            User object if authenticated, None otherwise
        """
        user = await self.get_user_by_email(email)
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    async def verify_user_password(self, email: str, password: str) -> Optional[User]:
        """
        Verify user credentials (alias for authenticate_user).

        Args:
            email: User email
            password: Plain password

        Returns:
            User object if valid, None otherwise
        """
        return await self.authenticate_user(email, password)

    async def is_admin(self, user_id: int) -> bool:
        """Check if a user is an admin."""
        result = await self.db.execute(
            text("SELECT user_id FROM ADMINS WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        return result.fetchone() is not None
