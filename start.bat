@echo off
echo Starting University App...
docker-compose up -d

echo Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Application services are running!
echo Access the application at: http://localhost
echo Access the API documentation at: http://localhost:8000/docs
echo Access RabbitMQ management at: http://localhost:15672
echo.
echo To stop the application, run: stop.bat or docker-compose down 