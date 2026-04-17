"""Reactions router with upsert/delete endpoints."""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api/reactions", tags=["Reactions"])


class ReactionCreate(BaseModel):
    post_id: int
    react_type: str


class ReactionResponse(BaseModel):
    user_id: int
    post_id: int
    react_type: str


@router.post("", response_model=ReactionResponse, status_code=status.HTTP_201_CREATED)
async def upsert_reaction(
    reaction_data: ReactionCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> ReactionResponse:
    """
    Add or update a reaction on a post.
    If the user already reacted, updates the type; otherwise inserts a new reaction.
    """
    post_id = reaction_data.post_id
    user_id = current_user.user_id
    react_type = reaction_data.react_type

    valid_types = {'LIKE', 'LOVE', 'HAHA', 'WOW', 'CARE', 'SAD', 'ANGRY'}
    if react_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reaction type. Must be one of: {', '.join(valid_types)}"
        )

    try:
        # Check if post exists
        post_check = await db.execute(
            text("SELECT post_id FROM POSTS WHERE post_id = :post_id"),
            {"post_id": post_id}
        )
        if not post_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        # Upsert: delete existing, then insert new
        await db.execute(
            text("DELETE FROM REACTIONS WHERE user_id = :user_id AND post_id = :post_id"),
            {"user_id": user_id, "post_id": post_id}
        )

        await db.execute(
            text("INSERT INTO REACTIONS (user_id, post_id, react_type) VALUES (:user_id, :post_id, :react_type)"),
            {"user_id": user_id, "post_id": post_id, "react_type": react_type}
        )
        await db.commit()

        return ReactionResponse(user_id=user_id, post_id=post_id, react_type=react_type)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reaction(
    post_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> None:
    """
    Remove a reaction from a post.
    """
    user_id = current_user.user_id

    result = await db.execute(
        text("DELETE FROM REACTIONS WHERE user_id = :user_id AND post_id = :post_id"),
        {"user_id": user_id, "post_id": post_id}
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )
