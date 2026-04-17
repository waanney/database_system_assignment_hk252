"""Groups router with membership endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

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


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Create a new group. The current user becomes the owner.
    The AFTER INSERT trigger on GROUPS automatically adds the owner to MEMBERSHIPS.
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

        # Fetch created group
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
    groups = [dict(zip(columns, row)) for row in rows]
    print("GROUPS API RESPONSE:", groups)
    return groups


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
    Get members of a group (including the owner).
    """
    result = await db.execute(
        text("""
            SELECT u.user_id, u.email, u.first_name, u.last_name, m.joined_at, g.owner_id
            FROM MEMBERSHIPS m
            JOIN USERS u ON m.user_id = u.user_id
            JOIN `GROUPS` g ON g.group_id = m.group_id
            WHERE m.group_id = :group_id
            ORDER BY CASE WHEN u.user_id = g.owner_id THEN 0 ELSE 1 END, m.joined_at ASC
        """),
        {"group_id": group_id}
    )
    rows = result.fetchall()
    columns = list(result.keys())

    members = []
    for row in rows:
        d = dict(zip(columns, row))
        d['is_owner'] = d.get('owner_id') == d['user_id']
        del d['owner_id']
        members.append(d)

    # Also get owner info if not already in MEMBERSHIPS
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
        owner_data['is_owner'] = True
        # Check if owner is already in members list
        if not any(m['user_id'] == owner_data['user_id'] for m in members):
            owner_data['joined_at'] = owner_data.get('joined_at', '')
            members.insert(0, owner_data)

    return members


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
    # Check if user is in MEMBERSHIPS table
    result = await db.execute(
        text("""
            SELECT * FROM MEMBERSHIPS
            WHERE group_id = :group_id AND user_id = :user_id
        """),
        {"group_id": group_id, "user_id": current_user.user_id}
    )
    row = result.fetchone()

    # If not in MEMBERSHIPS, check if user is the group owner
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
    # Check if group exists
    group_result = await db.execute(
        text("SELECT group_id FROM `GROUPS` WHERE group_id = :group_id"),
        {"group_id": group_id}
    )
    if not group_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    # Check if already a member
    existing_result = await db.execute(
        text("SELECT * FROM MEMBERSHIPS WHERE group_id = :group_id AND user_id = :user_id"),
        {"group_id": group_id, "user_id": current_user.user_id}
    )
    if existing_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already a member of this group"
        )

    # Join the group
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
    # Check if the user is the owner
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

    # Remove membership
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


@router.get("/{group_id}/my-groups", response_model=list[dict])
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
