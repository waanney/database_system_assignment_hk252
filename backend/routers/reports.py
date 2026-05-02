"""Reports router for admin report management."""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api/reports", tags=["Reports"])


class ReportResponse(BaseModel):
    report_id: int
    user_id: int
    post_id: int
    reason: str | None
    status: str
    created_at: str
    granted_at: str
    post_content: str | None = None
    post_owner_id: int | None = None


class ReportUpdate(BaseModel):
    status: str  # REVIEWED, ACTION_TAKEN, DISMISSED


class ReportCreate(BaseModel):
    post_id: int
    reason: str | None = None


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Submit a report for a post. Any authenticated user can report.
    """
    try:
        # Check if post exists
        post_check = await db.execute(
            text("SELECT post_id, user_id FROM POSTS WHERE post_id = :post_id"),
            {"post_id": report_data.post_id}
        )
        post_row = post_check.fetchone()
        if not post_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        await db.execute(
            text("""
                INSERT INTO REPORTS (user_id, post_id, reason, status)
                VALUES (:user_id, :post_id, :reason, 'PENDING')
            """),
            {
                "user_id": current_user.user_id,
                "post_id": report_data.post_id,
                "reason": report_data.reason,
            }
        )
        await db.commit()
        return {"message": "Report submitted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        error_msg = str(e)
        if "1644" in error_msg:
            msg_start = error_msg.find("MESSAGE_TEXT = '") + 15
            msg_end = error_msg.find("'", msg_start)
            trigger_msg = error_msg[msg_start:msg_end] if msg_start > 14 else "You cannot report this post."
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=trigger_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit report."
        )


@router.get("", response_model=list[dict])
async def list_reports(
    db: DBSession,
    current_user: CurrentActiveUser,
    status_filter: str | None = Query(None, alias="status"),
) -> list[dict]:
    """
    Get all reports. Admin only.
    """
    # Check if current user is admin
    admin_check = await db.execute(
        text("SELECT admin_level FROM ADMINS WHERE user_id = :user_id"),
        {"user_id": current_user.user_id}
    )
    admin_row = admin_check.fetchone()
    if not admin_row:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    if status_filter:
        result = await db.execute(
            text("""
                SELECT r.report_id, r.user_id, r.post_id, r.reason, r.status,
                       r.created_at, r.granted_at,
                       p.content as post_content, p.user_id as post_owner_id,
                       u.first_name, u.last_name, u.email as reporter_email
                FROM REPORTS r
                LEFT JOIN POSTS p ON r.post_id = p.post_id
                LEFT JOIN USERS u ON r.user_id = u.user_id
                WHERE r.status = :status_filter
                ORDER BY r.created_at DESC
            """),
            {"status_filter": status_filter}
        )
    else:
        result = await db.execute(
            text("""
                SELECT r.report_id, r.user_id, r.post_id, r.reason, r.status,
                       r.created_at, r.granted_at,
                       p.content as post_content, p.user_id as post_owner_id,
                       u.first_name, u.last_name, u.email as reporter_email
                FROM REPORTS r
                LEFT JOIN POSTS p ON r.post_id = p.post_id
                LEFT JOIN USERS u ON r.user_id = u.user_id
                ORDER BY r.created_at DESC
            """)
        )

    rows = result.fetchall()
    columns = list(result.keys())
    return [dict(zip(columns, row)) for row in rows]


@router.get("/{report_id}", response_model=dict)
async def get_report(
    report_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Get a single report detail. Admin only.
    """
    admin_check = await db.execute(
        text("SELECT admin_level FROM ADMINS WHERE user_id = :user_id"),
        {"user_id": current_user.user_id}
    )
    if not admin_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    result = await db.execute(
        text("""
            SELECT r.report_id, r.user_id, r.post_id, r.reason, r.status,
                   r.created_at, r.granted_at,
                   p.content as post_content, p.user_id as post_owner_id,
                   u.first_name, u.last_name, u.email as reporter_email
            FROM REPORTS r
            LEFT JOIN POSTS p ON r.post_id = p.post_id
            LEFT JOIN USERS u ON r.user_id = u.user_id
            WHERE r.report_id = :report_id
        """),
        {"report_id": report_id}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    columns = list(result.keys())
    return dict(zip(columns, row))


@router.put("/{report_id}", response_model=dict)
async def update_report(
    report_id: int,
    update_data: ReportUpdate,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Update report status and record review action. Admin only.
    """
    admin_check = await db.execute(
        text("SELECT admin_level FROM ADMINS WHERE user_id = :user_id"),
        {"user_id": current_user.user_id}
    )
    if not admin_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    valid_statuses = {'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'}
    if update_data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of: {', '.join(valid_statuses)}"
        )

    try:
        # Update report status
        await db.execute(
            text("UPDATE REPORTS SET status = :status WHERE report_id = :report_id"),
            {"status": update_data.status, "report_id": report_id}
        )

        # Record the review action
        await db.execute(
            text("INSERT IGNORE INTO REVIEW_REPORTS (report_id, admin_id) VALUES (:report_id, :admin_id)"),
            {"report_id": report_id, "admin_id": current_user.user_id}
        )
        await db.commit()

        return {"message": f"Report status updated to {update_data.status}"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
