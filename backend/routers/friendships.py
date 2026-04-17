"""Friendships router with friend request endpoints."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text

from auth.dependencies import CurrentActiveUser, DBSession

router = APIRouter(prefix="/api/friendships", tags=["Friendships"])


class UserSummary(BaseModel):
    user_id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    gender: str


@router.get("/me", response_model=dict)
async def get_friendship_data(
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Get all friendship data for the current user: friends, sent requests, received requests.
    """
    user_id = current_user.user_id

    # Get friends (accepted)
    friends_result = await db.execute(
        text("""
            SELECT u.user_id, u.email, u.first_name, u.last_name, u.gender
            FROM FRIENDSHIPS f
            JOIN USERS u ON (f.RECEIVER_ID = u.user_id OR f.SENDER_ID = u.user_id) AND u.user_id != :user_id
            WHERE (f.SENDER_ID = :user_id OR f.RECEIVER_ID = :user_id)
              AND f.status = 'ACCEPTED'
        """),
        {"user_id": user_id}
    )
    friends = [dict(row._mapping) for row in friends_result.fetchall()]

    # Get sent requests (pending)
    sent_result = await db.execute(
        text("""
            SELECT u.user_id, u.email, u.first_name, u.last_name, u.gender
            FROM FRIENDSHIPS f
            JOIN USERS u ON f.RECEIVER_ID = u.user_id
            WHERE f.SENDER_ID = :user_id AND f.status = 'PENDING'
        """),
        {"user_id": user_id}
    )
    sent_requests = [dict(row._mapping) for row in sent_result.fetchall()]

    # Get received requests (pending)
    received_result = await db.execute(
        text("""
            SELECT u.user_id, u.email, u.first_name, u.last_name, u.gender
            FROM FRIENDSHIPS f
            JOIN USERS u ON f.SENDER_ID = u.user_id
            WHERE f.RECEIVER_ID = :user_id AND f.status = 'PENDING'
        """),
        {"user_id": user_id}
    )
    received_requests = [dict(row._mapping) for row in received_result.fetchall()]

    return {
        "friends": friends,
        "sent_requests": sent_requests,
        "received_requests": received_requests,
    }


@router.post("/request/{receiver_id}", status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    receiver_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Send a friend request to another user.
    """
    if current_user.user_id == receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to yourself"
        )

    try:
        await db.execute(
            text("CALL friend_request(:sender_id, :receiver_id)"),
            {"sender_id": current_user.user_id, "receiver_id": receiver_id}
        )
        await db.commit()
        return {"message": "Friend request sent successfully"}

    except Exception as e:
        await db.rollback()
        error_message = str(e)

        if "Already friends" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already friends with this user"
            )
        if "Already sent friend request" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Friend request already sent"
            )
        if "already sent you a request" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This user already sent you a friend request. Please accept it instead."
            )
        if "Cannot friend yourself" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send friend request to yourself"
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send friend request"
        )


@router.post("/accept/{sender_id}", status_code=status.HTTP_200_OK)
async def accept_friend_request(
    sender_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Accept a friend request from another user.
    """
    try:
        await db.execute(
            text("CALL accept_friend(:sender_id, :receiver_id)"),
            {"sender_id": sender_id, "receiver_id": current_user.user_id}
        )
        await db.commit()
        return {"message": "Friend request accepted"}

    except Exception as e:
        await db.rollback()
        error_message = str(e)

        if "No pending friend request" in error_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending friend request from this user"
            )
        if "Already friends" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already friends with this user"
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept friend request"
        )


@router.post("/decline/{sender_id}", status_code=status.HTTP_200_OK)
async def decline_friend_request(
    sender_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Decline a friend request from another user.
    """
    try:
        await db.execute(
            text("CALL decline_cancel_fr(:sender_id, :receiver_id)"),
            {"sender_id": sender_id, "receiver_id": current_user.user_id}
        )
        await db.commit()
        return {"message": "Friend request declined"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decline friend request"
        )


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def unfriend_or_cancel(
    user_id: int,
    db: DBSession,
    current_user: CurrentActiveUser,
) -> dict:
    """
    Unfriend a user or cancel a sent friend request.
    This procedure tries decline_cancel_fr first, which handles sent requests.
    If that fails, it means there's no pending request from this user.
    """
    try:
        # Try to cancel/decline first (handles sent friend requests)
        await db.execute(
            text("CALL decline_cancel_fr(:sender_id, :receiver_id)"),
            {"sender_id": current_user.user_id, "receiver_id": user_id}
        )
        await db.commit()
        return {"message": "Request cancelled successfully"}

    except Exception as unfriend_error:
        await db.rollback()
        # If cancel failed, try unfriend (handles accepted friendships)
        try:
            await db.execute(
                text("CALL unfriend(:sender_id, :receiver_id)"),
                {"sender_id": current_user.user_id, "receiver_id": user_id}
            )
            await db.commit()
            return {"message": "Unfriended successfully"}
        except Exception:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No relationship or request with this user"
            )
