from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_db
from app.services.auth import (
    get_current_user,
    get_current_active_user,
    check_is_teacher,
    check_is_admin,
)
from app.models.user import User, UserRole

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


# Function to get the current user from the token
async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    """Get the current user from the token."""
    try:
        return await get_current_user(token, db)
    except HTTPException as e:
        # Перехватываем исключение и добавляем больше информации
        raise HTTPException(
            status_code=e.status_code,
            detail=f"Authentication failed: {e.detail}",
            headers=e.headers,
        )


# Get the current active user
async def get_current_active_user_dependency(
    current_user: User = Depends(get_current_user_from_token),
):
    """Get the current active user."""
    try:
        return await get_current_active_user(current_user)
    except HTTPException as e:
        # Добавляем больше информации об ошибке
        error_detail = f"User validation failed: {e.detail}"
        print(f"Authentication error: {error_detail}")
        raise HTTPException(
            status_code=e.status_code,
            detail=error_detail,
            headers=e.headers if hasattr(e, "headers") else None,
        )
    except Exception as e:
        # Обрабатываем неожиданные ошибки
        error_detail = f"Unexpected error during user validation: {str(e)}"
        print(f"Unexpected error: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail,
        )


# Check if the user is a teacher
async def teacher_required(
    current_user: User = Depends(get_current_active_user_dependency),
):
    """Check if the current user is a teacher."""
    return await check_is_teacher(current_user)


# Check if the user is an admin
async def admin_required(
    current_user: User = Depends(get_current_active_user_dependency),
):
    """Check if the current user is an admin."""
    return await check_is_admin(current_user)


# Check if the user has access to a specific group
async def check_group_access(
    group_id: str,
    current_user: User = Depends(get_current_active_user_dependency),
):
    """Check if the user has access to a specific group."""
    # Admins have access to all groups
    if current_user.role == UserRole.ADMIN:
        return True

    # Teachers can access groups they teach
    if current_user.role == UserRole.TEACHER:
        # In a real implementation, you would check if the teacher teaches this group
        # For now, we'll assume they do for simplicity
        return True

    # Students can only access their own group
    if current_user.role == UserRole.STUDENT:
        if str(current_user.group_id) != group_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this group",
            )
        return True
