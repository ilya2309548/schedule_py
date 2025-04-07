from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import date, time


class ScheduleBase(BaseModel):
    group_id: UUID4
    teacher_id: UUID4
    subject: str
    date: date
    start_time: time
    end_time: time
    room: str


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    group_id: Optional[UUID4] = None
    teacher_id: Optional[UUID4] = None
    subject: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[str] = None


class ScheduleInDB(ScheduleBase):
    id: UUID4

    class Config:
        orm_mode = True


class ScheduleResponse(ScheduleInDB):
    pass


class ScheduleWithDetailsResponse(ScheduleResponse):
    group_name: str
    teacher_name: str
