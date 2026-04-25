"""Comments router with list/create endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api/comments", tags=["Comments"])


class CommentCreate(BaseModel):
    post_id: int
    content: str
    parent_comment_id: int | None = None


class CommentResponse(BaseModel):
    comment_id: int
    post_id: int
    user_id: int
    parent_comment_id: int | None = None
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
    Get all comments and replies for a post.
    Replies (parent_comment_id IS NOT NULL) are nested under their parent comments.
    """
    result = await db.execute(
        text("""
            SELECT c.comment_id, c.post_id, c.user_id, c.parent_comment_id, c.content, c.created_at,
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
            parent_comment_id=row[3],
            content=row[4],
            created_at=str(row[5]),
            first_name=row[6],
            last_name=row[7],
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
    Create a new comment or reply on a post.
    If parent_comment_id is provided, creates a reply to that comment.
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

        if comment_data.parent_comment_id is not None:
            parent_check = await db.execute(
                text("SELECT comment_id FROM COMMENTS WHERE comment_id = :cid AND post_id = :pid"),
                {"cid": comment_data.parent_comment_id, "pid": comment_data.post_id}
            )
            if not parent_check.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found"
                )

        result = await db.execute(
            text("""
                INSERT INTO COMMENTS (post_id, user_id, content, parent_comment_id)
                VALUES (:post_id, :user_id, :content, :parent_comment_id)
            """),
            {
                "post_id": comment_data.post_id,
                "user_id": current_user.user_id,
                "content": comment_data.content,
                "parent_comment_id": comment_data.parent_comment_id,
            }
        )
        await db.commit()

        comment_id = result.lastrowid
        comment_result = await db.execute(
            text("""
                SELECT c.comment_id, c.post_id, c.user_id, c.parent_comment_id, c.content, c.created_at,
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
            parent_comment_id=row[3],
            content=row[4],
            created_at=str(row[5]),
            first_name=row[6],
            last_name=row[7],
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create comment: {str(e)}"
        )
