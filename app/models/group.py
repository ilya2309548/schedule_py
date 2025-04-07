import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.postgres import Base


class Group(Base):
    """Group model for university student groups."""

    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)

    # Relationships
    users = relationship("User", back_populates="group")
    schedules = relationship("Schedule", back_populates="group")
    assignments = relationship("Assignment", back_populates="group")

    def __repr__(self):
        return f"<Group {self.name}>"
