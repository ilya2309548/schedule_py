import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.postgres import Base


class Schedule(Base):
    """Schedule model for university classes."""

    __tablename__ = "schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(
        UUID(as_uuid=True), ForeignKey("groups.id"), nullable=False
    )
    teacher_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    subject = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="schedules")
    teacher = relationship("User", foreign_keys=[teacher_id])
    attendances = relationship("Attendance", back_populates="schedule")

    def __repr__(self):
        return f"<Schedule {self.subject}, {self.date}, {self.start_time}-{self.end_time}>"
