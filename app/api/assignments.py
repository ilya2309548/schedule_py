from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    UploadFile,
    File,
    Response,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.database.postgres import get_db
from app.models.assignment import Assignment
from app.models.user import User, UserRole
from app.models.group import Group
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentUpdate,
    AssignmentWithDetailsResponse,
    FileResponse,
)
from app.dependencies.auth import (
    get_current_active_user_dependency,
    teacher_required,
    admin_required,
)
from app.services.file_storage import upload_file, get_file, delete_file
from app.services.notifications import notify_new_assignment, notify_file_upload

router = APIRouter()


@router.post(
    "/assignments",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    assignment: AssignmentCreate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new assignment (teacher or admin only)."""
    # Убедимся, что deadline не содержит информацию о часовом поясе
    deadline = assignment.deadline
    if deadline and deadline.tzinfo:
        deadline = deadline.replace(tzinfo=None)

    # Create new assignment
    db_assignment = Assignment(
        group_id=assignment.group_id,
        teacher_id=current_user.id,  # Always use the current user's ID
        title=assignment.title,
        description=assignment.description,
        deadline=deadline,
        file_ids=[],
    )

    db.add(db_assignment)
    await db.commit()
    await db.refresh(db_assignment)

    # Notify students about the new assignment
    await notify_new_assignment(
        teacher=current_user,
        group_id=assignment.group_id,
        assignment_title=assignment.title,
    )

    return db_assignment


@router.get("/assignments", response_model=List[AssignmentWithDetailsResponse])
async def get_assignments(
    group_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get assignments with optional filtering."""
    # Включаем информацию о группе и преподавателе в запрос
    query = (
        select(
            Assignment,
            Group.name.label("group_name"),
            User.full_name.label("teacher_name"),
        )
        .join(Group, Assignment.group_id == Group.id)
        .join(User, Assignment.teacher_id == User.id)
    )

    # Filter by group ID
    if group_id:
        query = query.where(Assignment.group_id == group_id)

    # Order by created_at descending (newest first)
    query = query.order_by(Assignment.created_at.desc())

    result = await db.execute(query)
    rows = result.all()

    # Преобразуем результаты в объекты AssignmentWithDetailsResponse
    assignments = []
    for row in rows:
        assignment, group_name, teacher_name = row
        assignments.append(
            AssignmentWithDetailsResponse(
                id=assignment.id,
                group_id=assignment.group_id,
                teacher_id=assignment.teacher_id,
                title=assignment.title,
                description=assignment.description,
                file_ids=assignment.file_ids,
                created_at=assignment.created_at,
                deadline=assignment.deadline,
                group_name=group_name,
                teacher_name=teacher_name,
            )
        )

    return assignments


@router.get(
    "/assignments/{assignment_id}", response_model=AssignmentWithDetailsResponse
)
async def get_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific assignment by ID with details."""
    # Get assignment with group and teacher data
    query = (
        select(
            Assignment,
            Group.name.label("group_name"),
            User.full_name.label("teacher_name"),
        )
        .join(Group, Assignment.group_id == Group.id)
        .join(User, Assignment.teacher_id == User.id)
        .where(Assignment.id == assignment_id)
    )

    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    assignment, group_name, teacher_name = row

    # Create response with details
    response = AssignmentWithDetailsResponse(
        id=assignment.id,
        group_id=assignment.group_id,
        teacher_id=assignment.teacher_id,
        title=assignment.title,
        description=assignment.description,
        file_ids=assignment.file_ids,
        created_at=assignment.created_at,
        deadline=assignment.deadline,
        group_name=group_name,
        teacher_name=teacher_name,
    )

    return response


@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    assignment_update: AssignmentUpdate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Update an assignment (teacher or admin only)."""
    # Get the assignment
    stmt = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(stmt)
    db_assignment = result.scalars().first()

    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    # Check if the user is the teacher of this assignment or an admin
    if (
        current_user.role != UserRole.ADMIN
        and db_assignment.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own assignments",
        )

    # Получаем данные для обновления
    update_data = assignment_update.dict(exclude_unset=True)

    # Обрабатываем deadline если он есть в запросе
    if "deadline" in update_data and update_data["deadline"] is not None:
        if update_data["deadline"].tzinfo:
            update_data["deadline"] = update_data["deadline"].replace(
                tzinfo=None
            )

    # Update assignment data
    for key, value in update_data.items():
        setattr(db_assignment, key, value)

    await db.commit()
    await db.refresh(db_assignment)

    return db_assignment


@router.delete(
    "/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_assignment(
    assignment_id: str,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Delete an assignment (teacher or admin only)."""
    # Get the assignment
    stmt = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(stmt)
    db_assignment = result.scalars().first()

    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    # Check if the user is the teacher of this assignment or an admin
    if (
        current_user.role != UserRole.ADMIN
        and db_assignment.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own assignments",
        )

    # Delete associated files
    for file_id in db_assignment.file_ids:
        try:
            delete_file(file_id)
        except Exception as e:
            print(f"Failed to delete file {file_id}: {str(e)}")

    # Delete the assignment
    await db.delete(db_assignment)
    await db.commit()

    return None


@router.post("/assignments/{assignment_id}/files", response_model=FileResponse)
async def upload_assignment_file(
    assignment_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file to an assignment (teacher or admin only)."""
    # Check if assignment exists and user has access
    stmt = select(Assignment).where(Assignment.id == assignment_id)
    result = await db.execute(stmt)
    db_assignment = result.scalars().first()

    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found"
        )

    # Check if the user is the teacher of this assignment or an admin
    if (
        current_user.role != UserRole.ADMIN
        and db_assignment.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload files to your own assignments",
        )

    # Upload file
    file_id = await upload_file(file, str(assignment_id))

    # Update assignment with file ID
    db_assignment.file_ids = db_assignment.file_ids + [file_id]
    await db.commit()

    # Notify about file upload
    await notify_file_upload(UUID(assignment_id), file_id)

    # Get file info
    file_info = get_file(file_id)

    return FileResponse(
        id=file_id,
        file_name=file_info["filename"],
        content_type=file_info["content_type"],
        upload_date=file_info["metadata"]["upload_date"],
    )


@router.get("/files/{file_id}")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user_dependency),
):
    """Download a file."""
    # Get file
    file_info = get_file(file_id)

    # TODO: Check if user has access to this file
    # In a real implementation, you would check if the user has access to the assignment

    # Return file
    return Response(
        content=file_info["file"].read(),
        media_type=file_info["content_type"],
        headers={
            "Content-Disposition": f"attachment; filename={file_info['filename']}"
        },
    )
