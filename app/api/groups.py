from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID

from app.database.postgres import get_db
from app.models.user import User, UserRole
from app.models.group import Group
from app.schemas.group import (
    GroupCreate,
    GroupResponse,
    GroupUpdate,
    GroupWithStudentsResponse,
)
from app.schemas.user import UserResponse
from app.dependencies.auth import (
    get_current_active_user_dependency,
    admin_required,
    teacher_required,
)

router = APIRouter()


@router.post(
    "/groups",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_group(
    group: GroupCreate,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new student group (admin only)."""
    # Check if group with this name already exists
    stmt = select(Group).where(Group.name == group.name)
    result = await db.execute(stmt)
    existing_group = result.scalars().first()

    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group with this name already exists",
        )

    # Create new group
    db_group = Group(name=group.name)
    db.add(db_group)
    await db.commit()
    await db.refresh(db_group)

    return db_group


@router.get("/groups", response_model=List[GroupResponse])
async def get_groups(
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get all groups."""
    stmt = select(Group)
    result = await db.execute(stmt)
    groups = result.scalars().all()

    return groups


@router.get("/groups/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: UUID,
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific group by ID."""
    stmt = select(Group).where(Group.id == group_id)
    result = await db.execute(stmt)
    group = result.scalars().first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )

    return group


@router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: UUID,
    group_update: GroupUpdate,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """Update a group (admin only)."""
    # Get the group
    stmt = select(Group).where(Group.id == group_id)
    result = await db.execute(stmt)
    group = result.scalars().first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )

    # Check if new name already exists (if we're changing the name)
    if group_update.name and group_update.name != group.name:
        name_check = select(Group).where(Group.name == group_update.name)
        name_result = await db.execute(name_check)
        existing_name = name_result.scalars().first()

        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group with this name already exists",
            )

    # Update group data
    for key, value in group_update.dict(exclude_unset=True).items():
        setattr(group, key, value)

    await db.commit()
    await db.refresh(group)

    return group


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: UUID,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """Delete a group (admin only)."""
    # Get the group
    stmt = select(Group).where(Group.id == group_id)
    result = await db.execute(stmt)
    group = result.scalars().first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )

    # Check if group has any users
    if group.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete group with users. Move users to another group first.",
        )

    # Delete group
    await db.delete(group)
    await db.commit()


@router.get(
    "/groups/{group_id}/students", response_model=GroupWithStudentsResponse
)
async def get_group_with_students_count(
    group_id: UUID,
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get group information with student count."""
    stmt = select(Group).where(Group.id == group_id)
    result = await db.execute(stmt)
    group = result.scalars().first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )

    # Create response with student count
    return {
        "id": group.id,
        "name": group.name,
        "student_count": len(group.users),
    }


@router.get(
    "/groups/{group_id}/students/list", response_model=List[UserResponse]
)
async def get_group_students(
    group_id: UUID,
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get list of students in a group."""
    # Проверяем существование группы
    group_stmt = select(Group).where(Group.id == group_id)
    group_result = await db.execute(group_stmt)
    group = group_result.scalars().first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )

    # Получаем список студентов этой группы
    students_stmt = select(User).where(
        (User.group_id == group_id) & (User.role == UserRole.STUDENT)
    )
    students_result = await db.execute(students_stmt)
    students = students_result.scalars().all()

    return students
