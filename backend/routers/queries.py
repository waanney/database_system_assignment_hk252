"""Queries router for stored procedure endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api", tags=["Queries"])


class GroupMemberResponse(BaseModel):
    """Response schema for group member."""
    user_id: int
    first_name: str | None
    last_name: str | None
    email: str
    joined_at: str


class VerifiedGroupCountResponse(BaseModel):
    """Response schema for verified group count."""
    group_id: int
    group_name: str
    member_count: int


class FriendSearchResult(BaseModel):
    """Response schema for friend search result."""
    user_id: int
    first_name: str | None
    last_name: str | None
    email: str


@router.get("/friends/search", response_model=list[FriendSearchResult])
async def search_friends(
    current_user: CurrentActiveUser,
    db: DBSession,
    search_term: str = Query(..., min_length=1, description="Search term for friend lookup"),
) -> list[FriendSearchResult]:
    """
    Search for friends using search_friend procedure.
    """
    procedure_call = text("""
        CALL search_friend(:p_search_term, :p_current_user_id, @p_error_message)
    """)
    
    try:
        result = await db.execute(
            procedure_call,
            {
                "p_search_term": search_term,
                "p_current_user_id": current_user.user_id
            }
        )
        await db.commit()
        
        # Fetch results
        rows = result.fetchall()
        if rows:
            columns = result.keys()
            return [
                FriendSearchResult(
                    user_id=row[columns.index("user_id")],
                    first_name=row[columns.index("first_name")] if "first_name" in columns else None,
                    last_name=row[columns.index("last_name")] if "last_name" in columns else None,
                    email=row[columns.index("email")]
                )
                for row in rows
            ]
        return []
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/groups/{group_id}/members", response_model=list[GroupMemberResponse])
async def get_group_members(
    group_id: int,
    current_user: CurrentActiveUser,
    db: DBSession,
) -> list[GroupMemberResponse]:
    """
    Get members of a group using get_group_members procedure.
    """
    procedure_call = text("""
        CALL get_group_members(:p_group_id, @p_error_message)
    """)
    
    try:
        result = await db.execute(
            procedure_call,
            {"p_group_id": group_id}
        )
        await db.commit()
        
        # Fetch results
        rows = result.fetchall()
        if rows:
            columns = list(result.keys())
            members = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                members.append(GroupMemberResponse(
                    user_id=row_dict["user_id"],
                    first_name=row_dict.get("first_name"),
                    last_name=row_dict.get("last_name"),
                    email=row_dict["email"],
                    joined_at=str(row_dict.get("joined_at", ""))
                ))
            return members
        return []
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get group members: {str(e)}"
        )


@router.get("/groups/verified", response_model=list[VerifiedGroupCountResponse])
async def count_verified_groups(
    current_user: CurrentActiveUser,
    db: DBSession,
) -> list[VerifiedGroupCountResponse]:
    """
    Get count of verified groups using count_ver_group procedure.
    """
    procedure_call = text("""
        CALL count_ver_group(@p_error_message)
    """)
    
    try:
        result = await db.execute(procedure_call)
        await db.commit()
        
        # Fetch results
        rows = result.fetchall()
        if rows:
            columns = list(result.keys())
            groups = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                groups.append(VerifiedGroupCountResponse(
                    group_id=row_dict["group_id"],
                    group_name=row_dict["group_name"],
                    member_count=row_dict["member_count"]
                ))
            return groups
        return []
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get verified groups: {str(e)}"
        )
