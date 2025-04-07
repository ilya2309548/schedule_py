from pydantic import BaseModel, UUID4
from typing import Optional, List, Dict
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class AttendanceBase(BaseModel):
    schedule_id: UUID4
    student_id: UUID4
    status: AttendanceStatus


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: AttendanceStatus


class AttendanceInDB(AttendanceBase):
    id: UUID4

    class Config:
        from_attributes = True


class AttendanceResponse(AttendanceInDB):
    pass


class AttendanceWithDetailsResponse(AttendanceResponse):
    student_name: str
    subject: str
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    schedule_id: UUID4
    attendance_data: Dict[str, AttendanceStatus]  # student_id: status


class StudentAttendanceStats(BaseModel):
    total_classes: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    excused_count: int = 0
    present_percentage: float = 0.0
    absent_percentage: float = 0.0
    late_percentage: float = 0.0
    excused_percentage: float = 0.0
    attendance_percentage: float = 0.0
    missed_hours: float = 0.0  # Общее количество пропущенных часов
