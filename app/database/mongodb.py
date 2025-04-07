import os
import motor.motor_asyncio
from gridfs import GridFS
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "university_app_files")

# MongoDB client
client = None
db = None
fs = None  # GridFS instance


async def connect_to_mongodb():
    """Connect to MongoDB."""
    global client, db, fs

    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB_NAME]

    # For synchronous operations with GridFS (like storing files)
    sync_client = MongoClient(MONGO_URI)
    sync_db = sync_client[MONGO_DB_NAME]
    fs = GridFS(sync_db)

    print("Connected to MongoDB")


async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")


async def get_mongodb():
    """Get MongoDB database instance."""
    return db


def get_gridfs():
    """Get GridFS instance for file storage."""
    return fs
