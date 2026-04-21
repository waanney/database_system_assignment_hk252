"""Posts router with CRUD endpoints."""
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, text

from auth.dependencies import CurrentActiveUser, DBSession
from models.user import User
from schemas.user import UserResponse

router = APIRouter(prefix="/api/posts", tags=["Posts"])


class PostCreate(BaseModel):
    content: str
    visibility: str = "PUBLIC"


class PostResponse(BaseModel):
    post_id: int
    content: str
    visibility: str
    created_at: datetime
    user_id: int
    image_url: str | None = None
    first_name: str | None = None
    last_name: str | None = None


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> PostResponse:
    """
    Create a new post.
    """
    try:
        result = await db.execute(
            text("""
                INSERT INTO POSTS (content, visibility, user_id)
                VALUES (:content, :visibility, :user_id)
            """),
            {
                "content": post_data.content,
                "visibility": post_data.visibility,
                "user_id": current_user.user_id,
            }
        )
        await db.commit()

        # Fetch the created post
        post_id = result.lastrowid
        post_result = await db.execute(
            text("""
                SELECT p.*, u.first_name, u.last_name
                FROM POSTS p
                JOIN USERS u ON p.user_id = u.user_id
                WHERE p.post_id = :post_id
            """),
            {"post_id": post_id}
        )
        row = post_result.fetchone()
        columns = post_result.keys()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Post creation failed"
            )

        post_dict = dict(zip(columns, row))
        return PostResponse(**post_dict)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("", response_model=list[PostResponse])
async def list_posts(
    db: DBSession,
    current_user: CurrentActiveUser,
    user_id: int | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[PostResponse]:
    """
    Get list of posts (optionally filtered by user_id).
    """
    query = """
        SELECT p.*, u.first_name, u.last_name
        FROM POSTS p
        JOIN USERS u ON p.user_id = u.user_id
        WHERE (p.visibility = 'PUBLIC' OR p.user_id = :current_user_id)
    """
    params = {"current_user_id": current_user.user_id, "limit": limit, "offset": offset}
    
    if user_id:
        query += " AND p.user_id = :filter_user_id"
        params["filter_user_id"] = user_id
        
    query += " ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset"

    result = await db.execute(text(query), params)
    rows = result.fetchall()
    columns = result.keys()
    return [PostResponse(**dict(zip(columns, row))) for row in rows]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> PostResponse:
    """
    Get a single post by ID.
    """
    result = await db.execute(
        text("""
            SELECT p.*, u.first_name, u.last_name
            FROM POSTS p
            JOIN USERS u ON p.user_id = u.user_id
            WHERE p.post_id = :post_id
        """),
        {"post_id": post_id}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    columns = result.keys()
    return PostResponse(**dict(zip(columns, row)))


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> None:
    """
    Delete a post (only by the owner).
    """
    result = await db.execute(
        text("SELECT user_id FROM POSTS WHERE post_id = :post_id"),
        {"post_id": post_id}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    if row[0] != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )

    await db.execute(
        text("DELETE FROM POSTS WHERE post_id = :post_id"),
        {"post_id": post_id}
    )
    await db.commit()


@router.post("/share/{post_id}", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def share_post(
    post_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> PostResponse:
    """
    Share a post (creates a new post referencing the original via SHARED_POSTS).
    The shared post inherits PUBLIC visibility and the sharer's user_id.
    """
    try:
        # Fetch original post with author info
        original = await db.execute(
            text("""
                SELECT p.post_id, p.content, p.visibility, p.user_id,
                       u.first_name, u.last_name
                FROM POSTS p
                JOIN USERS u ON p.user_id = u.user_id
                WHERE p.post_id = :post_id
            """),
            {"post_id": post_id}
        )
        orig_row = original.fetchone()
        if not orig_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        author_name = f"{orig_row[4] or ''} {orig_row[5] or ''}".strip() or f"User #{orig_row[3]}"
        share_content = f"[Shared] {author_name}: \"{orig_row[1][:100]}{'...' if len(orig_row[1]) > 100 else ''}\""

        # Create the shared post
        result = await db.execute(
            text("""
                INSERT INTO POSTS (content, visibility, user_id)
                VALUES (:content, 'PUBLIC', :user_id)
            """),
            {"content": share_content, "user_id": current_user.user_id}
        )
        await db.commit()
        shared_post_id = result.lastrowid

        # Record the share relationship
        await db.execute(
            text("INSERT INTO SHARED_POSTS (post_id, parent_post_id) VALUES (:post_id, :parent_post_id)"),
            {"post_id": shared_post_id, "parent_post_id": post_id}
        )
        await db.commit()

        # Fetch the created post
        post_result = await db.execute(
            text("SELECT * FROM POSTS WHERE post_id = :post_id"),
            {"post_id": shared_post_id}
        )
        row = post_result.fetchone()
        columns = post_result.keys()
        post_dict = dict(zip(columns, row))
        return PostResponse(**post_dict)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
