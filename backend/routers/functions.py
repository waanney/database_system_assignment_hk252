"""Functions router for function endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api", tags=["Functions"])


class MutualFriendsResponse(BaseModel):
    """Response schema for mutual friends count."""
    user_id_1: int
    user_id_2: int
    mutual_friends_count: int


class PostReactionScoreResponse(BaseModel):
    """Response schema for post reaction score."""
    post_id: int
    weighted_score: float


class QualifiedMemberResponse(BaseModel):
    """Response schema for qualified group member."""
    user_id: int
    first_name: str | None
    last_name: str | None
    public_post_count: int


@router.get(
    "/users/{user_id_1}/mutual-friends/{user_id_2}",
    response_model=MutualFriendsResponse
)
async def get_mutual_friends_count(
    user_id_1: int,
    user_id_2: int,
    current_user: CurrentActiveUser,
    db: DBSession,
) -> MutualFriendsResponse:
    """
    Get count of mutual friends between two users.
    """
    if user_id_1 == user_id_2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot compare user with themselves"
        )
    
    try:
        result = await db.execute(
            text("SELECT get_mutual_friends_count(:p_user_id_1, :p_user_id_2) AS mutual_count"),
            {"p_user_id_1": user_id_1, "p_user_id_2": user_id_2}
        )
        row = result.fetchone()
        
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not calculate mutual friends"
            )
        
        return MutualFriendsResponse(
            user_id_1=user_id_1,
            user_id_2=user_id_2,
            mutual_friends_count=int(row[0])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        
        if "45000" in error_message or "User validation error" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate mutual friends: {error_message}"
        )


@router.get(
    "/posts/{post_id}/reaction-score",
    response_model=PostReactionScoreResponse
)
async def get_post_reaction_weighted_score(
    post_id: int,
    current_user: CurrentActiveUser,
    db: DBSession,
) -> PostReactionScoreResponse:
    """
    Get weighted reaction score for a post.
    """
    try:
        result = await db.execute(
            text("SELECT get_post_reaction_weighted_score(:p_post_id) AS weighted_score"),
            {"p_post_id": post_id}
        )
        row = result.fetchone()
        
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not calculate reaction score"
            )
        
        return PostReactionScoreResponse(
            post_id=post_id,
            weighted_score=float(row[0])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        
        if "45000" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate reaction score: {error_message}"
        )


@router.get(
    "/groups/{group_id}/qualified-members",
    response_model=list[QualifiedMemberResponse]
)
async def count_group_members_with_min_public_posts(
    group_id: int,
    current_user: CurrentActiveUser,
    db: DBSession,
    min_posts: int = Query(1, ge=0, description="Minimum number of public posts"),
) -> list[QualifiedMemberResponse]:
    """
    Get members of a group who have at least the specified number of public posts.
    """
    try:
        result = await db.execute(
            text("""
                SELECT * FROM count_group_members_with_min_public_posts(:p_group_id, :p_min_posts)
            """),
            {"p_group_id": group_id, "p_min_posts": min_posts}
        )
        
        rows = result.fetchall()
        
        if not rows:
            return []
        
        columns = list(result.keys())
        members = []
        
        for row in rows:
            row_dict = dict(zip(columns, row))
            members.append(QualifiedMemberResponse(
                user_id=row_dict["user_id"],
                first_name=row_dict.get("first_name"),
                last_name=row_dict.get("last_name"),
                public_post_count=row_dict.get("public_post_count", 0)
            ))
        
        return members
        
    except Exception as e:
        error_message = str(e)
        
        if "45000" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get qualified members: {error_message}"
        )
