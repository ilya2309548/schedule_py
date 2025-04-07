import os
from typing import BinaryIO, Optional, Dict, Any
from fastapi import HTTPException, UploadFile, status
from bson.objectid import ObjectId
from datetime import datetime
import mimetypes

from app.database.mongodb import get_gridfs


def validate_file_type(content_type: str, filename: str) -> bool:
    """Validate file type to prevent malicious uploads."""
    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
    ]

    # If content_type is not provided, try to guess from filename
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)

    return content_type in allowed_types


def create_file_metadata(
    assignment_id: str, filename: str, content_type: str
) -> Dict[str, Any]:
    """Create metadata for a file."""
    return {
        "assignment_id": assignment_id,
        "filename": filename,
        "content_type": content_type,
        "upload_date": datetime.utcnow(),
    }


async def upload_file(file: UploadFile, assignment_id: str) -> str:
    """Upload a file to GridFS."""
    fs = get_gridfs()
    if not fs:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage service unavailable",
        )

    content_type = file.content_type
    filename = file.filename or "unnamed_file"

    # Validate file type
    if not validate_file_type(content_type, filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {content_type} not allowed",
        )

    # Create metadata
    metadata = create_file_metadata(assignment_id, filename, content_type)

    # Store file in GridFS
    try:
        file_id = fs.put(
            file.file,
            filename=filename,
            metadata=metadata,
            content_type=content_type,
        )
        return str(file_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )


def get_file(file_id: str):
    """Get a file from GridFS."""
    fs = get_gridfs()
    if not fs:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage service unavailable",
        )

    try:
        # Convert string ID to ObjectId
        obj_id = ObjectId(file_id)
        if not fs.exists(obj_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
            )

        grid_out = fs.get(obj_id)

        return {
            "file": grid_out,
            "filename": grid_out.filename,
            "content_type": grid_out.content_type,
            "metadata": grid_out.metadata,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve file: {str(e)}",
        )


def delete_file(file_id: str) -> bool:
    """Delete a file from GridFS."""
    fs = get_gridfs()
    if not fs:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage service unavailable",
        )

    try:
        # Convert string ID to ObjectId
        obj_id = ObjectId(file_id)
        if not fs.exists(obj_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
            )

        fs.delete(obj_id)
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}",
        )
