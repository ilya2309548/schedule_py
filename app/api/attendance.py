from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from typing import List, Optional, Dict
from datetime import date
from pydantic import UUID4

from app.database.postgres import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.schedule import Schedule
from app.models.user import User, UserRole
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceUpdate,
    AttendanceWithDetailsResponse,
    BulkAttendanceCreate,
    StudentAttendanceStats,
)
from app.dependencies.auth import (
    get_current_active_user_dependency,
    teacher_required,
)
from app.services.notifications import notify_attendance_updated

router = APIRouter()


@router.post(
    "/attendance",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_attendance(
    attendance: AttendanceCreate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new attendance record (teacher only)."""
    # Check if schedule exists
    schedule_stmt = select(Schedule).where(
        Schedule.id == attendance.schedule_id
    )
    schedule_result = await db.execute(schedule_stmt)
    schedule = schedule_result.scalars().first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Check if the user is the teacher of this schedule or an admin
    if (
        current_user.role != UserRole.ADMIN
        and schedule.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark attendance for your own schedules",
        )

    # Check if attendance record already exists
    existing_stmt = select(Attendance).where(
        and_(
            Attendance.schedule_id == attendance.schedule_id,
            Attendance.student_id == attendance.student_id,
        )
    )
    existing_result = await db.execute(existing_stmt)
    existing_attendance = existing_result.scalars().first()

    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance record already exists",
        )

    # Create new attendance record
    db_attendance = Attendance(
        schedule_id=attendance.schedule_id,
        student_id=attendance.student_id,
        status=attendance.status,
    )

    db.add(db_attendance)
    await db.commit()
    await db.refresh(db_attendance)

    # Notify student about attendance update
    await notify_attendance_updated(
        student_id=attendance.student_id,
        schedule_id=attendance.schedule_id,
        status=attendance.status,
    )

    return db_attendance


@router.post(
    "/attendance/bulk",
    response_model=Dict[str, str],
    status_code=status.HTTP_201_CREATED,
)
async def create_bulk_attendance(
    bulk_attendance: BulkAttendanceCreate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple attendance records at once (teacher only)."""
    # Check if schedule exists
    schedule_stmt = select(Schedule).where(
        Schedule.id == bulk_attendance.schedule_id
    )
    schedule_result = await db.execute(schedule_stmt)
    schedule = schedule_result.scalars().first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Check if the user is the teacher of this schedule or an admin
    if (
        current_user.role != UserRole.ADMIN
        and schedule.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark attendance for your own schedules",
        )

    # Process each attendance record
    records_created = 0
    records_updated = 0

    for student_id, status in bulk_attendance.attendance_data.items():
        # Check if attendance record already exists
        existing_stmt = select(Attendance).where(
            and_(
                Attendance.schedule_id == bulk_attendance.schedule_id,
                Attendance.student_id == student_id,
            )
        )
        existing_result = await db.execute(existing_stmt)
        existing_attendance = existing_result.scalars().first()

        if existing_attendance:
            # Update existing record
            existing_attendance.status = status
            records_updated += 1
        else:
            # Create new record
            db_attendance = Attendance(
                schedule_id=bulk_attendance.schedule_id,
                student_id=student_id,
                status=status,
            )
            db.add(db_attendance)
            records_created += 1

        # Notify student about attendance update
        await notify_attendance_updated(
            student_id=student_id,
            schedule_id=bulk_attendance.schedule_id,
            status=status,
        )

    await db.commit()

    return {
        "message": f"Attendance processed successfully. Created: {records_created}, Updated: {records_updated}"
    }


@router.get("/attendance", response_model=List[AttendanceWithDetailsResponse])
async def get_attendance(
    schedule_id: Optional[UUID4] = Query(None),
    student_id: Optional[UUID4] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get attendance records with optional filtering."""
    # Build query to join attendance with schedule and student data
    query = (
        select(
            Attendance,
            User.full_name.label("student_name"),
            Schedule.subject,
            Schedule.date,
            Schedule.start_time,
            Schedule.end_time,
        )
        .join(Schedule, Attendance.schedule_id == Schedule.id)
        .join(User, Attendance.student_id == User.id)
    )

    # Apply filters
    if schedule_id:
        query = query.where(Attendance.schedule_id == schedule_id)
    if student_id:
        query = query.where(Attendance.student_id == student_id)

    # Filter by date range
    if date_from:
        query = query.where(Schedule.date >= date_from)
    if date_to:
        query = query.where(Schedule.date <= date_to)

    # Order by date and time
    query = query.order_by(Schedule.date.desc(), Schedule.start_time)

    result = await db.execute(query)
    rows = result.all()

    # Construct response
    attendance_list = []
    for row in rows:
        attendance, student_name, subject, date, start_time, end_time = row
        attendance_detail = AttendanceWithDetailsResponse(
            id=attendance.id,
            schedule_id=attendance.schedule_id,
            student_id=attendance.student_id,
            status=attendance.status,
            student_name=student_name,
            subject=subject,
            date=date.strftime("%Y-%m-%d") if date else None,
            start_time=start_time.strftime("%H:%M") if start_time else None,
            end_time=end_time.strftime("%H:%M") if end_time else None,
        )
        attendance_list.append(attendance_detail)

    return attendance_list


@router.get("/attendance/stats", response_model=StudentAttendanceStats)
async def get_attendance_stats(
    student_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Get attendance statistics for a student."""
    try:
        # If no student_id provided, use current user (for students)
        if not student_id:
            if current_user.role == UserRole.STUDENT:
                student_id = str(current_user.id)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student ID must be provided",
                )

        # Check if user has permission to view this student's stats
        if (
            current_user.role == UserRole.STUDENT
            and str(current_user.id) != student_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own attendance stats",
            )

        # Проверяем существование студента
        student_query = select(User).where(User.id == student_id)
        student_result = await db.execute(student_query)
        student = student_result.scalars().first()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        if student.role != UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided ID is not a student",
            )

        # Get attendance records with schedule details to calculate missed hours
        attendance_query = (
            select(Attendance, Schedule.start_time, Schedule.end_time)
            .join(Schedule, Attendance.schedule_id == Schedule.id)
            .where(Attendance.student_id == student_id)
        )

        attendance_result = await db.execute(attendance_query)
        attendance_records = attendance_result.all()

        # Initialize counters
        total_classes = len(attendance_records)
        present_count = 0
        absent_count = 0
        late_count = 0
        excused_count = 0
        missed_hours = 0.0

        # Calculate statistics by manually processing each record
        for record in attendance_records:
            attendance, start_time, end_time = record

            # Count by status
            try:
                if attendance.status == AttendanceStatus.PRESENT:
                    present_count += 1
                elif attendance.status == AttendanceStatus.ABSENT:
                    absent_count += 1
                    # Calculate missed hours for absent
                    if start_time and end_time:
                        missed_hours += 2.0  # 2 hours for absent
                elif attendance.status == AttendanceStatus.LATE:
                    late_count += 1
                    # Calculate missed hours for late
                    if start_time and end_time:
                        missed_hours += 1.0  # 1 hour for late
                elif attendance.status == AttendanceStatus.EXCUSED:
                    excused_count += 1
            except Exception as e:
                print(f"Error processing status: {str(e)}")
                # Если возникла ошибка с enum, просто пропускаем эту запись
                # и не учитываем её в статистике
                total_classes -= 1

        # Calculate percentages
        present_percentage = (
            (present_count / total_classes * 100) if total_classes > 0 else 0
        )
        absent_percentage = (
            (absent_count / total_classes * 100) if total_classes > 0 else 0
        )
        late_percentage = (
            (late_count / total_classes * 100) if total_classes > 0 else 0
        )
        excused_percentage = (
            (excused_count / total_classes * 100) if total_classes > 0 else 0
        )

        # Общий процент посещаемости (присутствие + уважительная причина считаются как посещение)
        attendance_percentage = (
            ((present_count + excused_count) / total_classes * 100)
            if total_classes > 0
            else 0
        )

        return StudentAttendanceStats(
            total_classes=total_classes,
            present_count=present_count,
            absent_count=absent_count,
            late_count=late_count,
            excused_count=excused_count,
            present_percentage=present_percentage,
            absent_percentage=absent_percentage,
            late_percentage=late_percentage,
            excused_percentage=excused_percentage,
            attendance_percentage=attendance_percentage,
            missed_hours=missed_hours,
        )
    except Exception as e:
        # Логирование ошибки
        print(f"Error in get_attendance_stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating attendance statistics: {str(e)}",
        )


@router.put("/attendance/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: str,
    attendance_update: AttendanceUpdate,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Update an attendance record (teacher only)."""
    # Get the attendance record
    stmt = select(Attendance).where(Attendance.id == attendance_id)
    result = await db.execute(stmt)
    db_attendance = result.scalars().first()

    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    # Check if schedule belongs to the teacher
    schedule_stmt = select(Schedule).where(
        Schedule.id == db_attendance.schedule_id
    )
    schedule_result = await db.execute(schedule_stmt)
    schedule = schedule_result.scalars().first()

    if (
        current_user.role != UserRole.ADMIN
        and schedule.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update attendance for your own schedules",
        )

    # Update attendance data
    db_attendance.status = attendance_update.status

    await db.commit()
    await db.refresh(db_attendance)

    # Notify student about attendance update
    await notify_attendance_updated(
        student_id=db_attendance.student_id,
        schedule_id=db_attendance.schedule_id,
        status=db_attendance.status,
    )

    return db_attendance


@router.get(
    "/attendance/students_by_schedule/{schedule_id}",
    response_model=List[Dict],
)
async def get_students_by_schedule(
    schedule_id: str,
    current_user: User = Depends(teacher_required),
    db: AsyncSession = Depends(get_db),
):
    """Get list of students for a specific schedule with their attendance status."""
    # Get schedule information
    schedule_query = select(Schedule).where(Schedule.id == schedule_id)
    schedule_result = await db.execute(schedule_query)
    schedule = schedule_result.scalars().first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Check if the user is the teacher of this schedule or an admin
    if (
        current_user.role != UserRole.ADMIN
        and schedule.teacher_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view students for your own schedules",
        )

    # Get students from the group
    students_query = select(User).where(
        and_(
            User.group_id == schedule.group_id,
            User.role == UserRole.STUDENT,
        )
    )
    students_result = await db.execute(students_query)
    students = students_result.scalars().all()

    # Get existing attendance records for this schedule
    attendance_query = select(Attendance).where(
        Attendance.schedule_id == schedule_id
    )
    attendance_result = await db.execute(attendance_query)
    attendance_records = attendance_result.scalars().all()

    # Create lookup dictionary for attendance records
    attendance_dict = {
        record.student_id: record for record in attendance_records
    }

    # Build response with student information and attendance status
    students_data = []
    for student in students:
        attendance_record = attendance_dict.get(student.id)
        status = attendance_record.status if attendance_record else None

        students_data.append(
            {
                "student_id": str(student.id),
                "full_name": student.full_name,
                "email": student.email,
                "attendance_status": status,
                "attendance_id": (
                    str(attendance_record.id) if attendance_record else None
                ),
            }
        )

    return students_data


@router.get("/attendance/fix_enum", status_code=status.HTTP_200_OK)
async def fix_attendance_enum(
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Fix attendance status enum in the database."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    try:
        # Применяем SQL-запрос напрямую через соединение
        # В случае ошибки, считаем что значение уже есть и продолжаем
        connection = await db.connection()
        try:
            await connection.execute(
                "ALTER TYPE attendancestatus ADD VALUE IF NOT EXISTS 'LATE';"
            )
        except Exception as e:
            print(f"Error adding enum value, might already exist: {str(e)}")

        # Теперь, чтобы избежать ошибок с enum, заменим прямые запросы на подсчёт
        # Получить количество записей по разным статусам
        absent_count = 0
        late_count = 0
        present_count = 0
        excused_count = 0
        total_classes = 0

        # Получить все записи посещаемости студента
        attendance_query = select(Attendance).where(
            Attendance.student_id == current_user.id
        )
        result = await db.execute(attendance_query)
        attendances = result.scalars().all()

        # Посчитать статусы вручную
        for attendance in attendances:
            total_classes += 1
            try:
                if attendance.status == AttendanceStatus.ABSENT:
                    absent_count += 1
                elif attendance.status == AttendanceStatus.LATE:
                    late_count += 1
                elif attendance.status == AttendanceStatus.PRESENT:
                    present_count += 1
                elif attendance.status == AttendanceStatus.EXCUSED:
                    excused_count += 1
            except Exception as e:
                print(f"Error processing status: {str(e)}")

        return {
            "message": "Attendance enum fixed",
            "diagnostics": {
                "total": total_classes,
                "absent": absent_count,
                "late": late_count,
                "present": present_count,
                "excused": excused_count,
            },
        }
    except Exception as e:
        print(f"Error in fix_attendance_enum: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fixing enum: {str(e)}",
        )
