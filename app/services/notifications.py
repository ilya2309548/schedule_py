from typing import Dict, Any, List, Optional
from uuid import UUID

from app.database.rabbitmq import send_notification, queue_file_processing
from app.models.user import User


async def notify_new_assignment(
    teacher: User, group_id: UUID, assignment_title: str
):
    """Notify students about a new assignment."""
    # In a real implementation, you would query the database to get all students in this group
    # For now, we'll just simulate the notification

    message = f"New assignment '{assignment_title}' has been posted."

    # This would typically be a batch operation to send notifications to all students
    # For this example, we'll just log the notification
    print(f"Notification to group {group_id}: {message}")

    # In a real implementation, you might do something like this:
    # for student in students:
    #     send_notification(student.id, message, "assignment")

    return True


async def notify_file_upload(assignment_id: UUID, file_id: str):
    """Notify about a new file upload and queue it for processing."""
    # Queue file for processing (e.g., virus scan, thumbnail generation)
    success = queue_file_processing(file_id, "process_new_upload")

    if not success:
        print(f"Failed to queue file {file_id} for processing")

    return success


async def notify_attendance_updated(
    student_id: UUID, schedule_id: UUID, status: str
):
    """Notify a student about their attendance being updated."""
    message = f"Your attendance status has been updated to '{status}'."

    # Send notification to the student
    success = send_notification(str(student_id), message, "attendance")

    if not success:
        print(f"Failed to send notification to student {student_id}")

    return success


class NotificationType:
    ASSIGNMENT = "assignment"
    ATTENDANCE = "attendance"
    GENERAL = "general"


def create_notification_payload(
    user_id: UUID,
    title: str,
    message: str,
    notification_type: str = NotificationType.GENERAL,
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a notification payload."""
    return {
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "type": notification_type,
        "data": data or {},
    }
