import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import Depends, HTTPException, status
from dotenv import load_dotenv

from app.database.postgres import get_db
from app.models.user import User
from app.schemas.user import TokenData, UserRole

# Load environment variables
load_dotenv()

# JWT settings
SECRET_KEY = os.getenv(
    "SECRET_KEY", "your-secret-key-needs-to-be-at-least-32-characters-long"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720")
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Get password hash."""
    return pwd_context.hash(password)


async def authenticate_user(db: AsyncSession, username: str, password: str):
    """Authenticate a user with username and password."""
    user = await get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user


async def get_user_by_username(db: AsyncSession, username: str):
    """Get a user by username."""
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: str):
    """Get a user by ID."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str, db: AsyncSession = Depends(get_db)):
    """Get the current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Проверим, что токен не пустой
        if not token or token == "undefined":
            print("Authentication error: Token is missing or invalid")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token is missing or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError as e:
            print(f"JWT decode error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token validation failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        username: str = payload.get("sub")
        if username is None:
            print("Authentication error: Username not found in token")
            raise credentials_exception

        token_data = TokenData(username=username, role=payload.get("role"))
    except JWTError as e:
        # Добавляем детали ошибки для отладки
        print(f"JWT error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_username(db, token_data.username)
    if user is None:
        print(
            f"Authentication error: User not found for username {token_data.username}"
        )
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
):
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def check_is_teacher(
    current_user: User = Depends(get_current_active_user),
):
    """Check if the current user is a teacher."""
    if (
        current_user.role != UserRole.TEACHER
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Teacher role required.",
        )
    return current_user


async def check_is_admin(current_user: User = Depends(get_current_active_user)):
    """Check if the current user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required.",
        )
    return current_user
