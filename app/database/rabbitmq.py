import os
import pika
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# RabbitMQ Configuration
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

# RabbitMQ connection
connection = None
channel = None

# Queues
NOTIFICATION_QUEUE = "notifications"
FILE_PROCESSING_QUEUE = "file_processing"


def connect_to_rabbitmq():
    """Connect to RabbitMQ server."""
    global connection, channel

    # Create a connection parameters object
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        virtual_host=RABBITMQ_VHOST,
        credentials=credentials,
    )

    try:
        # Establish connection
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Declare queues
        channel.queue_declare(queue=NOTIFICATION_QUEUE, durable=True)
        channel.queue_declare(queue=FILE_PROCESSING_QUEUE, durable=True)

        print("Connected to RabbitMQ")
        return True
    except Exception as e:
        print(f"Failed to connect to RabbitMQ: {str(e)}")
        return False


def close_rabbitmq_connection():
    """Close RabbitMQ connection."""
    global connection
    if connection and connection.is_open:
        connection.close()
        print("Disconnected from RabbitMQ")


def publish_message(queue, message):
    """Publish a message to a queue."""
    global channel

    if not channel or not channel.is_open:
        if not connect_to_rabbitmq():
            return False

    try:
        channel.basic_publish(
            exchange='',
            routing_key=queue,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
            ),
        )
        return True
    except Exception as e:
        print(f"Failed to publish message: {str(e)}")
        return False


def send_notification(user_id, message, notification_type="info"):
    """Send a notification to a user."""
    notification = {
        "user_id": user_id,
        "message": message,
        "type": notification_type,
    }
    return publish_message(NOTIFICATION_QUEUE, notification)


def queue_file_processing(file_id, operation):
    """Queue a file for processing."""
    file_task = {"file_id": file_id, "operation": operation}
    return publish_message(FILE_PROCESSING_QUEUE, file_task)
