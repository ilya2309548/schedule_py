import uuid
from sqlalchemy import Column, String, ForeignKey, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.postgres import Base


class Assignment(Base):
    """Assignment model for course assignments."""

    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(
        UUID(as_uuid=True), ForeignKey("groups.id"), nullable=False
    )
    teacher_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_ids = Column(ARRAY(String), default=[])
    created_at = Column(
        DateTime,
        default=lambda: datetime.utcnow().replace(tzinfo=None),
        nullable=False,
    )
    deadline = Column(DateTime, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="assignments")
    teacher = relationship("User", back_populates="assignments_created")

    def __repr__(self):
        return f"<Assignment {self.title}, group={self.group_id}>"
