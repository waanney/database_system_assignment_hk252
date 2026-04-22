"""Comments router with list/create endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api/comments", tags=["Comments"])


class CommentCreate(BaseModel):
    post_id: int
    content: str


class CommentResponse(BaseModel):
    comment_id: int
    post_id: int
    user_id: int
    content: str
    created_at: str
    first_name: str | None = None
    last_name: str | None = None


@router.get("", response_model=list[CommentResponse])
async def list_comments(
    db: DBSession,
    current_user: CurrentActiveUser,
    post_id: int = Query(..., description="Post ID to get comments for"),
) -> list[CommentResponse]:
    """
    Get all comments for a post.
    """
    result = await db.execute(
        text("""
            SELECT c.comment_id, c.post_id, c.user_id, c.content, c.created_at,
                   u.first_name, u.last_name
            FROM COMMENTS c
            LEFT JOIN USERS u ON c.user_id = u.user_id
            WHERE c.post_id = :post_id
            ORDER BY c.created_at ASC
        """),
        {"post_id": post_id}
    )
    rows = result.fetchall()
    return [
        CommentResponse(
            comment_id=row[0],
            post_id=row[1],
            user_id=row[2],
            content=row[3],
            created_at=str(row[4]),
            first_name=row[5],
            last_name=row[6],
        )
        for row in rows
    ]


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: CommentCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> CommentResponse:
    """
    Create a new comment on a post.
    """
    try:
        post_check = await db.execute(
            text("SELECT post_id FROM POSTS WHERE post_id = :post_id"),
            {"post_id": comment_data.post_id}
        )
        if not post_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        result = await db.execute(
            text("""
                INSERT INTO COMMENTS (post_id, user_id, content)
                VALUES (:post_id, :user_id, :content)
            """),
            {
                "post_id": comment_data.post_id,
                "user_id": current_user.user_id,
                "content": comment_data.content,
            }
        )
        await db.commit()

        comment_id = result.lastrowid
        comment_result = await db.execute(
            text("""
                SELECT c.comment_id, c.post_id, c.user_id, c.content, c.created_at,
                       u.first_name, u.last_name
                FROM COMMENTS c
                LEFT JOIN USERS u ON c.user_id = u.user_id
                WHERE c.comment_id = :comment_id
            """),
            {"comment_id": comment_id}
        )
        row = comment_result.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Comment not found after insert"
            )

        return CommentResponse(
            comment_id=row[0],
            post_id=row[1],
            user_id=row[2],
            content=row[3],
            created_at=str(row[4]),
            first_name=row[5],
            last_name=row[6],
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )
