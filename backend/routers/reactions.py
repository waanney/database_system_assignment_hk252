"""Reactions router with list/upsert/delete endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import bindparam, text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api/reactions", tags=["Reactions"])


class ReactionCreate(BaseModel):
    post_id: int
    react_type: str


class ReactionResponse(BaseModel):
    user_id: int
    post_id: int
    react_type: str
    first_name: str | None = None
    last_name: str | None = None


@router.get("", response_model=list[ReactionResponse])
async def list_reactions(
    db: DBSession,
    current_user: CurrentActiveUser,
    post_ids: str | None = Query(None),
) -> list[ReactionResponse]:
    """
    Get persisted reactions, optionally limited to a comma-separated list of post IDs.
    """
    del current_user

    params: dict[str, list[int]] = {}
    statement = text("""
        SELECT r.user_id, r.post_id, r.react_type, u.first_name, u.last_name
        FROM REACTIONS r
        LEFT JOIN USERS u ON u.user_id = r.user_id
    """)

    if post_ids:
        try:
            parsed_post_ids = sorted({
                int(part.strip())
                for part in post_ids.split(",")
                if part.strip()
            })
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="post_ids must be a comma-separated list of integers"
            ) from exc

        if not parsed_post_ids:
            return []

        statement = text(
            """
            SELECT r.user_id, r.post_id, r.react_type, u.first_name, u.last_name
            FROM REACTIONS r
            LEFT JOIN USERS u ON u.user_id = r.user_id
            WHERE r.post_id IN :post_ids
            """
        ).bindparams(bindparam("post_ids", expanding=True))
        params["post_ids"] = parsed_post_ids

    result = await db.execute(statement, params)
    return [ReactionResponse(**dict(row._mapping)) for row in result.fetchall()]


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

        return ReactionResponse(
            user_id=user_id,
            post_id=post_id,
            react_type=react_type,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
        )

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

    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )

    await db.commit()
