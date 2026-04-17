"""Authentication router with login and register endpoints."""
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession
from auth.jwt import create_access_token, hash_password
from config import get_settings
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from schemas.user import UserResponse
from services.user_service import UserService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: DBSession,
) -> TokenResponse:
    """
    Authenticate user and return JWT token.
    """
    user_service = UserService(db)
    user = await user_service.verify_user_password(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: DBSession,
) -> UserResponse:
    """
    Register a new user.
    """
    hashed_password = hash_password(request.password)

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
        "p_email": request.email,
        "p_phone_number": request.phone_number,
        "p_password_hash": hashed_password,
        "p_first_name": request.first_name,
        "p_last_name": request.last_name,
        "p_date_of_birth": request.date_of_birth,
        "p_gender": request.gender
    }

    try:
        await db.execute(procedure_call, params)
        await db.commit()

        # Fetch the created user
        from sqlalchemy import select
        from models.user import User
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User creation failed"
            )

        return UserResponse.model_validate(user)

    except Exception as e:
        await db.rollback()
        error_message = str(e)

        if "Duplicate entry" in error_message:
            if "email" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists"
                )
            elif "phone_number" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number already exists"
                )

        # Clean up SQL error messages for better user experience
        if "45000" in error_message:
            # Extract the actual error message from SQL error
            import re
            match = re.search(r"SET MESSAGE_TEXT = '([^']+)'", error_message)
            if match:
                detail_msg = match.group(1)
            else:
                # Try to find error message another way
                detail_match = re.search(r"User validation error:?\s*(.+?)(?:\s*\n|$)", error_message, re.IGNORECASE)
                detail_msg = detail_match.group(1) if detail_match else error_message
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail_msg
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    db: DBSession,
    current_user: CurrentActiveUser,
) -> UserResponse:
    """
    Get the currently authenticated user's profile.
    """
    user_service = UserService(db)
    user = await user_service.get_user_by_id(current_user.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user is an admin
    admin_result = await db.execute(
        text("SELECT user_id FROM ADMINS WHERE user_id = :user_id"),
        {"user_id": current_user.user_id}
    )
    is_admin = admin_result.fetchone() is not None

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
