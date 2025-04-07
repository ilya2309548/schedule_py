from pydantic import BaseModel, Field, EmailStr, UUID4
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserBase(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    role: UserRole
    group_id: Optional[UUID4] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    group_id: Optional[UUID4] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    id: UUID4
    is_active: bool = True

    class Config:
        orm_mode = True


class UserResponse(UserInDB):
    pass


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None
