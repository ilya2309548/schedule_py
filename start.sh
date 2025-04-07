#!/bin/bash

# Start the application with Docker Compose
echo "Starting University App..."
docker-compose up -d

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 5

# Display access information
echo ""
echo "Application services are running!"
echo "Access the application at: http://localhost"
echo "Access the API documentation at: http://localhost:8000/docs"
echo "Access RabbitMQ management at: http://localhost:15672"
echo ""
echo "To stop the application, run: ./stop.sh or docker-compose down" 