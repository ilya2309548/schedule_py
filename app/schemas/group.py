from pydantic import BaseModel, UUID4
from typing import Optional, List


class GroupBase(BaseModel):
    name: str


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None


class GroupInDB(GroupBase):
    id: UUID4

    class Config:
        orm_mode = True


class GroupResponse(GroupInDB):
    pass


class GroupWithStudentsResponse(GroupResponse):
    student_count: int
