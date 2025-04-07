import uuid
from sqlalchemy import Column, String, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.database.postgres import Base


class UserRole(str, PyEnum):
    """User role enum."""

    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    """User model for students, teachers, and admins."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    group_id = Column(
        UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True
    )
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    group = relationship("Group", back_populates="users")
    attendances = relationship("Attendance", back_populates="student")
    assignments_created = relationship("Assignment", back_populates="teacher")

    def __repr__(self):
        return f"<User {self.username}, role={self.role}>"
