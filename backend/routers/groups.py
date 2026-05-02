"""Groups router with membership endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession
from config import get_settings

router = APIRouter(prefix="/api/groups", tags=["Groups"])


class GroupCreate(BaseModel):
    name: str
    description: str | None = None


class GroupResponse(BaseModel):
    group_id: int
    name: str
    description: str | None
    owner_id: int
    created_at: str
    member_count: int


# ─── Static-path routes MUST come before /{group_id} routes ───────────────────

@router.get("/my-groups", response_model=list[dict])
async def get_my_groups(
    db: DBSession,
    current_user: CurrentActiveUser,
) -> list[dict]:
    """
    Get groups the current user is a member of (including owned groups).
    """
    result = await db.execute(
        text("""
            SELECT DISTINCT g.*, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM MEMBERSHIPS WHERE group_id = g.group_id) +
                   (CASE WHEN g.owner_id IS NOT NULL THEN 1 ELSE 0 END) as member_count
            FROM `GROUPS` g
            LEFT JOIN USERS u ON g.owner_id = u.user_id
            LEFT JOIN MEMBERSHIPS m ON g.group_id = m.group_id AND m.user_id = :user_id
            WHERE m.user_id = :user_id OR g.owner_id = :user_id
            ORDER BY g.created_at DESC
        """),
        {"user_id": current_user.user_id}
    )
    rows = result.fetchall()
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in rows]


@router.get("", response_model=list[dict])
async def list_groups(
    db: DBSession,
    current_user: CurrentActiveUser,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    """
    Get list of all groups.
    """
    result = await db.execute(
        text("""
            SELECT g.*, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM MEMBERSHIPS WHERE group_id = g.group_id) +
                   (CASE WHEN g.owner_id IS NOT NULL THEN 1 ELSE 0 END) as member_count
            FROM `GROUPS` g
            LEFT JOIN USERS u ON g.owner_id = u.user_id
            ORDER BY g.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"limit": limit, "offset": offset}
    )
    rows = result.fetchall()
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in rows]


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Create a new group. The current user becomes the owner.
    """
    try:
        result = await db.execute(
            text("""
                INSERT INTO `GROUPS` (name, description, owner_id)
                VALUES (:name, :description, :owner_id)
            """),
            {
                "name": group_data.name,
                "description": group_data.description,
                "owner_id": current_user.user_id,
            }
        )
        await db.commit()
        group_id = result.lastrowid

        # Insert owner into MEMBERSHIPS directly.
        # This fires tg_after_insert_membership which correctly updates member_count
        # because the GROUPS table lock was released by the commit above.
        await db.execute(
            text("""
                INSERT IGNORE INTO MEMBERSHIPS (group_id, user_id)
                VALUES (:group_id, :user_id)
            """),
            {"group_id": group_id, "user_id": current_user.user_id}
        )
        await db.commit()

        group_result = await db.execute(
            text("SELECT * FROM `GROUPS` WHERE group_id = :group_id"),
            {"group_id": group_id}
        )
        row = group_result.fetchone()
        columns = list(group_result.keys())
        return dict(zip(columns, row))

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ─── /{group_id} routes come AFTER static-path routes ─────────────────────────

@router.get("/{group_id}", response_model=dict)
async def get_group(
    group_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Get group details.
    """
    result = await db.execute(
        text("""
            SELECT g.*, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM MEMBERSHIPS WHERE group_id = g.group_id) +
                   (CASE WHEN g.owner_id IS NOT NULL THEN 1 ELSE 0 END) as member_count
            FROM `GROUPS` g
            LEFT JOIN USERS u ON g.owner_id = u.user_id
            WHERE g.group_id = :group_id
        """),
        {"group_id": group_id}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    columns = list(result.keys())
    return dict(zip(columns, row))


@router.get("/{group_id}/members", response_model=list[dict])
async def get_group_members(
    group_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> list[dict]:
    """
    Get all members of a group (including the owner) using the stored procedure.
    """
    settings = get_settings()
    import aiomysql

    safe_sql = f"CALL get_group_members({group_id})"

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
                while await cursor.nextset():
                    pass
                members = [{k.lower(): v for k, v in row.items()} for row in (rows if rows else [])]
    finally:
        pool.close()
        await pool.wait_closed()

    owner_result = await db.execute(
        text("""
            SELECT u.user_id, u.email, u.first_name, u.last_name, g.created_at as joined_at
            FROM `GROUPS` g
            JOIN USERS u ON g.owner_id = u.user_id
            WHERE g.group_id = :group_id
        """),
        {"group_id": group_id}
    )
    owner_row = owner_result.fetchone()
    if owner_row:
        owner_cols = list(owner_result.keys())
        owner_data = dict(zip(owner_cols, owner_row))
        owner_data["is_owner"] = True
        if not any(m["user_id"] == owner_data["user_id"] for m in members):
            owner_data["joined_at"] = owner_data.get("joined_at", "")
            members.insert(0, owner_data)

    return members


@router.get("/{group_id}/rules", response_model=list[dict])
async def get_group_rules(
    group_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> list[dict]:
    """
    Get all rules for a group.
    """
    result = await db.execute(
        text("""
            SELECT rule_id, title, description
            FROM GROUP_RULES
            WHERE group_id = :group_id
            ORDER BY rule_id ASC
        """),
        {"group_id": group_id}
    )
    rows = result.fetchall()
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in rows]


@router.get("/{group_id}/my-membership", response_model=dict)
async def get_my_membership(
    group_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Check if current user is a member of the group.
    Group owners are automatically considered members.
    """
    result = await db.execute(
        text("""
            SELECT * FROM MEMBERSHIPS
            WHERE group_id = :group_id AND user_id = :user_id
        """),
        {"group_id": group_id, "user_id": current_user.user_id}
    )
    row = result.fetchone()

    if not row:
        owner_result = await db.execute(
            text("SELECT owner_id FROM `GROUPS` WHERE group_id = :group_id"),
            {"group_id": group_id}
        )
        owner_row = owner_result.fetchone()
        is_member = owner_row and owner_row[0] == current_user.user_id
    else:
        is_member = True

    return {"is_member": is_member}


@router.post("/{group_id}/join", status_code=status.HTTP_201_CREATED)
async def join_group(
    group_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Join a group.
    """
    group_result = await db.execute(
        text("SELECT group_id FROM `GROUPS` WHERE group_id = :group_id"),
        {"group_id": group_id}
    )
    if not group_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    existing_result = await db.execute(
        text("SELECT * FROM MEMBERSHIPS WHERE group_id = :group_id AND user_id = :user_id"),
        {"group_id": group_id, "user_id": current_user.user_id}
    )
    if existing_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already a member of this group"
        )

    await db.execute(
        text("INSERT INTO MEMBERSHIPS (group_id, user_id) VALUES (:group_id, :user_id)"),
        {"group_id": group_id, "user_id": current_user.user_id}
    )
    await db.commit()

    return {"message": "Successfully joined the group"}


@router.delete("/{group_id}/leave", status_code=status.HTTP_200_OK)
async def leave_group(
    group_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Leave a group.
    """
    owner_result = await db.execute(
        text("SELECT owner_id FROM `GROUPS` WHERE group_id = :group_id"),
        {"group_id": group_id}
    )
    owner_row = owner_result.fetchone()
    if owner_row and owner_row[0] == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group owners cannot leave. Transfer ownership first."
        )

    result = await db.execute(
        text("DELETE FROM MEMBERSHIPS WHERE group_id = :group_id AND user_id = :user_id"),
        {"group_id": group_id, "user_id": current_user.user_id}
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not a member of this group"
        )

    return {"message": "Successfully left the group"}
