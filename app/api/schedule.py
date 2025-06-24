from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import date, datetime

from app.database.postgres import get_db
from app.models.schedule import Schedule
from app.models.user import User, UserRole
from app.models.group import Group
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleResponse,
    ScheduleUpdate,
    ScheduleWithDetailsResponse,
)
from app.dependencies.auth import (
    get_current_active_user_dependency,
    teacher_required,
    admin_required,
)

router = APIRouter()


@router.post(
    "/schedule",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_schedule(
    schedule: ScheduleCreate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new schedule entry (teacher or admin only)."""
    # Create new schedule entry
    db_schedule = Schedule(
        group_id=schedule.group_id,
        teacher_id=schedule.teacher_id,
        subject=schedule.subject,
        date=schedule.date,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        room=schedule.room,
    )

    db.add(db_schedule)
    await db.commit()
    await db.refresh(db_schedule)

    return db_schedule


@router.get("/schedule", response_model=List[ScheduleWithDetailsResponse])
async def get_schedules(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    group_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get schedules with optional filtering."""
    # Build base query with joins for detailed info
    query = (
        select(
            Schedule,
            Group.name.label("group_name"),
            User.full_name.label("teacher_name"),
        )
        .join(Group, Schedule.group_id == Group.id)
        .join(User, Schedule.teacher_id == User.id)
    )

    # Apply filters
    if start_date:
        query = query.where(Schedule.date >= start_date)
    if end_date:
        query = query.where(Schedule.date <= end_date)

    # Filter by group ID
    if group_id:
        query = query.where(Schedule.group_id == group_id)

    # For students, only show their group's schedules
    if current_user.role == UserRole.STUDENT and current_user.group_id:
        query = query.where(Schedule.group_id == current_user.group_id)
    # For teachers, only show their schedules
    elif current_user.role == UserRole.TEACHER:
        query = query.where(Schedule.teacher_id == current_user.id)

    # Order by date and time
    query = query.order_by(Schedule.date, Schedule.start_time)

    result = await db.execute(query)
    rows = result.all()

    # Convert results to response models
    schedules = []
    for row in rows:
        schedule, group_name, teacher_name = row
        schedules.append(
            ScheduleWithDetailsResponse(
                id=schedule.id,
                group_id=schedule.group_id,
                teacher_id=schedule.teacher_id,
                subject=schedule.subject,
                date=schedule.date,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                room=schedule.room,
                group_name=group_name,
                teacher_name=teacher_name,
            )
        )

    return schedules


@router.get(
    "/schedule/{schedule_id}", response_model=ScheduleWithDetailsResponse
)
async def get_schedule(
    schedule_id: str,
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific schedule by ID with details."""
    # Get schedule with group and teacher data
    query = (
        select(
            Schedule,
            Group.name.label("group_name"),
            User.full_name.label("teacher_name"),
        )
        .join(Group, Schedule.group_id == Group.id)
        .join(User, Schedule.teacher_id == User.id)
        .where(Schedule.id == schedule_id)
    )

    # For students, only allow access to their group's schedules
    if current_user.role == UserRole.STUDENT and current_user.group_id:
        query = query.where(Schedule.group_id == current_user.group_id)
    # For teachers, only allow access to their schedules
    elif current_user.role == UserRole.TEACHER:
        query = query.where(Schedule.teacher_id == current_user.id)

    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    schedule, group_name, teacher_name = row

    # Create response with details
    response = ScheduleWithDetailsResponse(
        id=schedule.id,
        group_id=schedule.group_id,
        teacher_id=schedule.teacher_id,
        subject=schedule.subject,
        date=schedule.date,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        room=schedule.room,
        group_name=group_name,
        teacher_name=teacher_name,
    )

    return response


@router.put("/schedule/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule_update: ScheduleUpdate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Update a schedule entry (teacher or admin only)."""
    # Get the schedule
    stmt = select(Schedule).where(Schedule.id == schedule_id)
    result = await db.execute(stmt)
    db_schedule = result.scalars().first()

    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Check if the user is the teacher of this schedule or an admin
    if (
        current_user.role != UserRole.ADMIN
        and db_schedule.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own schedules",
        )

    # Update schedule data
    for key, value in schedule_update.dict(exclude_unset=True).items():
        setattr(db_schedule, key, value)

    await db.commit()
    await db.refresh(db_schedule)

    return db_schedule


@router.delete(
    "/schedule/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_schedule(
    schedule_id: str,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Delete a schedule entry (teacher or admin only)."""
    # Get the schedule
    stmt = select(Schedule).where(Schedule.id == schedule_id)
    result = await db.execute(stmt)
    db_schedule = result.scalars().first()

    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Check if the user is the teacher of this schedule or an admin
    if (
        current_user.role != UserRole.ADMIN
        and db_schedule.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own schedule entries",
        )

    # Delete the schedule
    await db.delete(db_schedule)
    await db.commit()

    return None


@router.get(
    "/schedule/day/{day}", response_model=List[ScheduleWithDetailsResponse]
)
async def get_schedule_by_day(
    day: str,
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get schedules for a specific day of the week."""
    # Map day name to the corresponding PostgreSQL day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    day_mapping = {
        "monday": 1,
        "tuesday": 2,
        "wednesday": 3,
        "thursday": 4,
        "friday": 5,
        "saturday": 6,
        "sunday": 0,
    }

    # Check if the provided day is valid
    day = day.lower()
    if day not in day_mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid day of the week. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday",
        )

    # Extract day of week from date
    day_of_week = day_mapping[day]

    # Build query with joins for detailed info
    query = (
        select(
            Schedule,
            Group.name.label("group_name"),
            User.full_name.label("teacher_name"),
        )
        .join(Group, Schedule.group_id == Group.id)
        .join(User, Schedule.teacher_id == User.id)
        .where(func.extract('dow', Schedule.date) == day_of_week)
    )

    # For students, only show their group's schedules
    if current_user.role == UserRole.STUDENT and current_user.group_id:
        query = query.where(Schedule.group_id == current_user.group_id)
    # For teachers, only show their schedules
    elif current_user.role == UserRole.TEACHER:
        query = query.where(Schedule.teacher_id == current_user.id)

    # Order by date and time
    query = query.order_by(Schedule.date, Schedule.start_time)

    result = await db.execute(query)
    rows = result.all()

    # Convert results to response models
    schedules = []
    for row in rows:
        schedule, group_name, teacher_name = row
        schedules.append(
            ScheduleWithDetailsResponse(
                id=schedule.id,
                group_id=schedule.group_id,
                teacher_id=schedule.teacher_id,
                subject=schedule.subject,
                date=schedule.date,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                room=schedule.room,
                group_name=group_name,
                teacher_name=teacher_name,
            )
        )

    return schedules


@router.get("/schedule/today", response_model=List[ScheduleWithDetailsResponse])
async def get_schedules_today(
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Get today's schedules for the current teacher."""
    try:
        today = datetime.now().date()
        print(
            f"Получение расписания на сегодня ({today}) для пользователя {current_user.id}"
        )

        # Build query with joins for detailed info
        query = (
            select(
                Schedule,
                Group.name.label("group_name"),
                User.full_name.label("teacher_name"),
            )
            .join(Group, Schedule.group_id == Group.id)
            .join(User, Schedule.teacher_id == User.id)
            .where(Schedule.date == today)
        )

        # For teachers, only show their schedules
        if current_user.role == UserRole.TEACHER:
            query = query.where(Schedule.teacher_id == current_user.id)

        # Order by time
        query = query.order_by(Schedule.start_time)

        result = await db.execute(query)
        rows = result.all()

        print(f"Найдено {len(rows)} пар на сегодня")

        # Convert results to response models
        schedules = []
        for row in rows:
            schedule, group_name, teacher_name = row
            schedules.append(
                ScheduleWithDetailsResponse(
                    id=schedule.id,
                    group_id=schedule.group_id,
                    teacher_id=schedule.teacher_id,
                    subject=schedule.subject,
                    date=schedule.date,
                    start_time=schedule.start_time,
                    end_time=schedule.end_time,
                    room=schedule.room,
                    group_name=group_name,
                    teacher_name=teacher_name,
                )
            )

        return schedules
    except Exception as e:
        print(f"Ошибка при получении расписания на сегодня: {str(e)}")
        # Возвращаем пустой список вместо ошибки
        return []
