import uuid
from sqlalchemy import Column, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.database.postgres import Base


class AttendanceStatus(str, PyEnum):
    """Attendance status enum."""

    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class Attendance(Base):
    """Attendance model for tracking student attendance."""

    __tablename__ = "attendances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(
        UUID(as_uuid=True), ForeignKey("schedules.id"), nullable=False
    )
    student_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status = Column(
        Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT
    )

    # Relationships
    schedule = relationship("Schedule", back_populates="attendances")
    student = relationship("User", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance schedule={self.schedule_id}, student={self.student_id}, status={self.status}>"
