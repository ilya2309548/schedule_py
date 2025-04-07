from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database.postgres import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    UserLogin,
    Token,
)
from app.services.auth import (
    create_access_token,
    authenticate_user,
    get_password_hash,
)
from app.dependencies.auth import (
    get_current_active_user_dependency,
    admin_required,
)

router = APIRouter()


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if username already exists
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        password_hash=hashed_password,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        group_id=user.group_id,
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return db_user


@router.post("/auth/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Get an access token using username and password."""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_active_user_dependency),
):
    """Get the current user's information."""
    try:
        return current_user
    except Exception as e:
        # Логируем ошибку для отладки
        print(f"Error in read_users_me: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}",
        )


@router.put("/auth/me", response_model=UserResponse)
async def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user_dependency),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's information."""
    # Update user data
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.get("/auth/users", response_model=List[UserResponse])
async def get_users(
    admin: User = Depends(admin_required), db: AsyncSession = Depends(get_db)
):
    """Get all users (admin only)."""
    stmt = select(User)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return users


@router.get("/auth/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    admin: User = Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID (admin only)."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user
