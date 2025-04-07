from pydantic import BaseModel, UUID4, validator
from typing import Optional, List
from datetime import datetime


class AssignmentBase(BaseModel):
    group_id: UUID4
    teacher_id: UUID4
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None

    @validator('deadline')
    def validate_deadline(cls, v):
        if v and v.tzinfo:
            # Убираем информацию о часовом поясе для совместимости с PostgreSQL
            return v.replace(tzinfo=None)
        return v


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None

    @validator('deadline')
    def validate_deadline(cls, v):
        if v and v.tzinfo:
            # Убираем информацию о часовом поясе для совместимости с PostgreSQL
            return v.replace(tzinfo=None)
        return v


class AssignmentInDB(AssignmentBase):
    id: UUID4
    file_ids: List[str] = []
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class AssignmentResponse(AssignmentInDB):
    pass


class AssignmentWithDetailsResponse(AssignmentResponse):
    group_name: str
    teacher_name: str


class FileUpload(BaseModel):
    assignment_id: UUID4
    file_name: str
    content_type: str


class FileResponse(BaseModel):
    id: str
    file_name: str
    content_type: str
    upload_date: datetime
