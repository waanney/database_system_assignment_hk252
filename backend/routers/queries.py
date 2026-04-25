"""Queries router for stored procedure endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from auth.dependencies import CurrentActiveUser, DBSession
from config import get_settings

router = APIRouter(prefix="/api", tags=["Queries"])


class GroupMemberResponse(BaseModel):
    user_id: int
    first_name: str | None
    last_name: str | None
    email: str
    joined_at: str


class VerifiedGroupCountResponse(BaseModel):
    group_id: int
    group_name: str
    member_count: int


class UserSearchResult(BaseModel):
    user_id: int
    first_name: str | None
    last_name: str | None
    email: str


class GroupSearchResult(BaseModel):
    group_id: int
    name: str
    description: str | None


class FriendSearchResult(BaseModel):
    user_id: int
    first_name: str | None
    last_name: str | None
    email: str


async def _run_procedure(call_sql: str, params: dict) -> list[dict]:
    """
    Execute a stored procedure and return results as list of dicts with lowercase keys.
    Uses a direct aiomysql connection for reliable procedure result handling.
    Named parameters are inlined with proper escaping for safe SQL execution.
    """
    settings = get_settings()
    import aiomysql

    # Inline named parameters into the SQL string.
    # MySQL stored procedures accept only inline values, not ? / :name placeholders.
    def inline_params(sql: str, p: dict) -> str:
        import re
        def replacer(m):
            name = m.group(1)
            val = p.get(name)
            if val is None:
                return "NULL"
            if isinstance(val, str):
                # Escape single quotes for SQL safety
                escaped = val.replace("'", "''")
                return f"'{escaped}'"
            return str(val)
        return re.sub(r":(\w+)", replacer, sql)

    safe_sql = inline_params(call_sql, params)

    pool = await aiomysql.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
        autocommit=True,
    )
    try:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(safe_sql)
                rows = await cursor.fetchall()
                # Consume any remaining result sets left by the stored procedure
                while await cursor.nextset():
                    pass
                # Normalize column names to lowercase for Pydantic model compatibility
                return [
                    {k.lower(): v for k, v in row.items()}
                    for row in (rows if rows else [])
                ]
    finally:
        pool.close()
        await pool.wait_closed()


@router.get("/friends/search", response_model=list[FriendSearchResult])
async def search_friends(
    current_user: CurrentActiveUser,
    db: DBSession,
    q: str = Query(..., min_length=1, description="Search term for friend lookup"),
) -> list[FriendSearchResult]:
    """
    Search for friends by name using search_friend procedure.
    """
    try:
        rows = await _run_procedure(
            "CALL search_friend(:p_search_term, :p_current_user_id)",
            {"p_search_term": q, "p_current_user_id": current_user.user_id}
        )
        return [
            FriendSearchResult(
                user_id=r["user_id"],
                first_name=r.get("first_name"),
                last_name=r.get("last_name"),
                email=r["email"],
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


@router.get("/friends/pending", response_model=list[FriendSearchResult])
async def search_pending_requests(
    current_user: CurrentActiveUser,
    db: DBSession,
) -> list[FriendSearchResult]:
    """
    Get pending friend requests received using search_pending_fr procedure.
    """
    try:
        rows = await _run_procedure(
            "CALL search_pending_fr(:p_user_id)",
            {"p_user_id": current_user.user_id}
        )
        return [
            FriendSearchResult(
                user_id=r["user_id"],
                first_name=r.get("first_name"),
                last_name=r.get("last_name"),
                email=r["email"],
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {e}")


@router.get("/friends/sent", response_model=list[FriendSearchResult])
async def search_sent_requests(
    current_user: CurrentActiveUser,
    db: DBSession,
) -> list[FriendSearchResult]:
    """
    Get sent friend requests using search_sent_fr procedure.
    """
    try:
        rows = await _run_procedure(
            "CALL search_sent_fr(:p_user_id)",
            {"p_user_id": current_user.user_id}
        )
        return [
            FriendSearchResult(
                user_id=r["user_id"],
                first_name=r.get("first_name"),
                last_name=r.get("last_name"),
                email=r["email"],
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {e}")


@router.get("/users/search", response_model=list[UserSearchResult])
async def search_users(
    db: DBSession,
    current_user: CurrentActiveUser,
    q: str = Query(..., min_length=1, description="Search term for user lookup"),
) -> list[UserSearchResult]:
    """
    Search all users by name using search_user procedure.
    """
    try:
        rows = await _run_procedure(
            "CALL search_user(:p_search_term)",
            {"p_search_term": q}
        )
        return [
            UserSearchResult(
                user_id=r["user_id"],
                first_name=r.get("first_name"),
                last_name=r.get("last_name"),
                email=r["email"],
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


@router.get("/groups/search", response_model=list[GroupSearchResult])
async def search_groups(
    db: DBSession,
    current_user: CurrentActiveUser,
    q: str = Query(..., min_length=1, description="Search term for group lookup"),
) -> list[GroupSearchResult]:
    """
    Search groups by name or description using search_group procedure.
    """
    try:
        rows = await _run_procedure(
            "CALL search_group(:p_search_term)",
            {"p_search_term": q}
        )
        return [
            GroupSearchResult(
                group_id=r["group_id"],
                name=r["name"],
                description=r.get("description"),
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")


@router.get("/groups/{group_id}/friends-in-group", response_model=list[UserSearchResult])
async def get_friends_in_group(
    group_id: int,
    current_user: CurrentActiveUser,
    db: DBSession,
) -> list[UserSearchResult]:
    """
    Get friends of the current user who are also members of a group,
    using get_friends_in_group procedure.
    """
    try:
        rows = await _run_procedure(
            "CALL get_friends_in_group(:p_user_id, :p_group_id)",
            {"p_user_id": current_user.user_id, "p_group_id": group_id}
        )
        return [
            UserSearchResult(
                user_id=r["user_id"],
                first_name=r.get("first_name"),
                last_name=r.get("last_name"),
                email=r["email"],
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {e}")


@router.get("/groups/verified", response_model=list[VerifiedGroupCountResponse])
async def count_verified_groups(
    current_user: CurrentActiveUser,
    db: DBSession,
) -> list[VerifiedGroupCountResponse]:
    """
    Get groups that have verified members using count_ver_group procedure.
    """
    try:
        rows = await _run_procedure("CALL count_ver_group()", {})
        return [
            VerifiedGroupCountResponse(
                group_id=r["group_id"],
                group_name=r["group_name"],
                member_count=r["member_count"],
            )
            for r in rows
        ]
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {e}")
