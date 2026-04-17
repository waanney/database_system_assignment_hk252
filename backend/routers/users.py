"""Users router with CRUD endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, text

from auth.dependencies import CurrentActiveUser, DBSession
from models.user import User
from schemas.user import UserCreate, UserListResponse, UserResponse, UserUpdate
from services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> UserResponse:
    """
    Create a new user (admin only).
    """
    from auth.jwt import hash_password
    
    hashed_password = hash_password(user_data.password)
    
    procedure_call = text("""
        CALL sp_InsertUser(
            :p_email,
            :p_phone_number,
            :p_password_hash,
            :p_first_name,
            :p_last_name,
            :p_date_of_birth,
            :p_gender,
            @p_result,
            @p_error_message
        )
    """)
    
    params = {
        "p_email": user_data.email,
        "p_phone_number": user_data.phone_number,
        "p_password_hash": hashed_password,
        "p_first_name": user_data.first_name,
        "p_last_name": user_data.last_name,
        "p_date_of_birth": str(user_data.date_of_birth) if user_data.date_of_birth else None,
        "p_gender": user_data.gender.value if user_data.gender else None
    }
    
    try:
        await db.execute(procedure_call, params)
        await db.commit()
        
        # Fetch created user
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == user_data.email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User creation failed"
            )
        
        return UserResponse(
            user_id=user.user_id,
            email=user.email,
            phone_number=user.phone_number,
            first_name=user.first_name,
            last_name=user.last_name,
            date_of_birth=user.date_of_birth,
            gender=user.gender,
            is_active=user.is_active,
            created_at=user.created_at,
            is_admin=False,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        error_message = str(e)
        
        if "Duplicate entry" in error_message:
            if "email" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
            elif "phone_number" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number already registered"
                )
        
        if "45000" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get("", response_model=UserListResponse)
async def list_users(
    db: DBSession,
    current_user: CurrentActiveUser,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str | None = Query(None, description="Search by name"),
) -> UserListResponse:
    """
    Get paginated list of users. Optionally filter by name search.
    """
    user_service = UserService(db)
    users, total = await user_service.get_users_paginated(limit=limit, offset=offset, search=search)

    async def build_response(u: User) -> UserResponse:
        admin = await user_service.is_admin(u.user_id)
        return UserResponse(
            user_id=u.user_id, email=u.email, phone_number=u.phone_number,
            first_name=u.first_name, last_name=u.last_name,
            date_of_birth=u.date_of_birth, gender=u.gender,
            is_active=u.is_active, created_at=u.created_at, is_admin=admin,
        )

    items = [await build_response(u) for u in users]

    return UserListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/all", response_model=list[UserResponse])
async def get_all_users(
    db: DBSession,
    current_user: CurrentActiveUser,
) -> list[UserResponse]:
    """
    Get all users without pagination (for dropdowns and selectors).
    """
    user_service = UserService(db)
    result = await db.execute(
        select(User).order_by(User.user_id)
    )
    users = list(result.scalars().all())

    async def build_response(u: User) -> UserResponse:
        admin = await user_service.is_admin(u.user_id)
        return UserResponse(
            user_id=u.user_id, email=u.email, phone_number=u.phone_number,
            first_name=u.first_name, last_name=u.last_name,
            date_of_birth=u.date_of_birth, gender=u.gender,
            is_active=u.is_active, created_at=u.created_at, is_admin=admin,
        )

    items = [await build_response(u) for u in users]
    return items


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> UserResponse:
    """
    Get user by ID.
    """
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    is_admin = await user_service.is_admin(user_id)

    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        phone_number=user.phone_number,
        first_name=user.first_name,
        last_name=user.last_name,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        is_active=user.is_active,
        created_at=user.created_at,
        is_admin=is_admin,
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> UserResponse:
    """
    Update an existing user.
    """
    # Check if user exists
    user_service = UserService(db)
    existing_user = await user_service.get_user_by_id(user_id)
    
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    procedure_call = text("""
        CALL sp_UpdateUser(
            :p_user_id,
            :p_email,
            :p_phone_number,
            :p_first_name,
            :p_last_name,
            :p_date_of_birth,
            :p_gender,
            :p_is_active,
            @p_result,
            @p_error_message
        )
    """)
    
    params = {
        "p_user_id": user_id,
        "p_email": user_data.email,
        "p_phone_number": user_data.phone_number,
        "p_first_name": user_data.first_name,
        "p_last_name": user_data.last_name,
        "p_date_of_birth": str(user_data.date_of_birth) if user_data.date_of_birth else None,
        "p_gender": user_data.gender.value if user_data.gender else None,
        "p_is_active": user_data.is_active
    }
    
    try:
        await db.execute(procedure_call, params)
        await db.commit()
        
        # Fetch updated user
        result = await db.execute(
            text("SELECT * FROM USERS WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User update failed"
            )
        
        # Convert to UserResponse
        columns = result.keys()
        user_dict = dict(zip(columns, row))
        is_admin = await user_service.is_admin(user_id)
        return UserResponse(
            user_id=user_dict["user_id"],
            email=user_dict["email"],
            phone_number=user_dict["phone_number"],
            first_name=user_dict["first_name"],
            last_name=user_dict["last_name"],
            date_of_birth=user_dict["date_of_birth"],
            gender=user_dict["gender"],
            is_active=user_dict["is_active"],
            created_at=user_dict["created_at"],
            is_admin=is_admin,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        error_message = str(e)
        
        if "Duplicate entry" in error_message:
            if "email" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
            elif "phone_number" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number already registered"
                )
        
        if "45000" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> None:
    """
    Delete a user.
    """
    # Check if user exists
    user_service = UserService(db)
    existing_user = await user_service.get_user_by_id(user_id)
    
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    procedure_call = text("""
        CALL sp_DeleteUser(
            :p_user_id,
            @p_result,
            @p_error_message
        )
    """)
    
    try:
        await db.execute(procedure_call, {"p_user_id": user_id})
        await db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        error_message = str(e)
        
        if "45000" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )
