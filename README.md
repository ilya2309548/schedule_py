# University App 

Полное приложение для университета, включающее бэкенд и фронтенд.

## Features

- Пользовательская аутентификация (студенты и преподаватели)
- Расписание занятий
- Отправка и просмотр заданий
- Отслеживание посещаемости
- Хранение файлов (фотографии и документы)
- Панель администратора
- Современный пользовательский интерфейс в синей цветовой схеме

## Technology Stack

- **Бэкенд**: FastAPI с документацией Swagger
- **Фронтенд**: React с адаптивным дизайном
- **Базы данных**:
  - PostgreSQL: Основная база данных для пользователей, расписаний, посещаемости, заданий
  - MongoDB: Хранилище для файлов (фотографии и документы)
- **Очередь сообщений**: RabbitMQ для асинхронных задач
- **Контейнеризация**: Docker для развертывания

## Setup and Installation

### Prerequisites

- Docker и Docker Compose
- Python 3.9+ (для локальной разработки без Docker)
- Node.js 14+ (для локальной разработки фронтенда без Docker)

### Docker Setup (Recommended)

Самый простой способ запустить приложение - использовать Docker:

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/yourusername/university_app.git
   cd university_app
   ```

2. Запустите с Docker Compose:
   ```
   docker-compose up -d
   ```
   Это запустит все необходимые сервисы: FastAPI бэкенд, React фронтенд, PostgreSQL, MongoDB и RabbitMQ.

3. Доступ к приложению:
   - Фронтенд: `http://localhost`
   - API документация: `http://localhost:8000/docs`
   - RabbitMQ управление: `http://localhost:15672`

4. Чтобы остановить все контейнеры:
   ```
   docker-compose down
   ```

### Local Development Setup (Alternative)

Если вы предпочитаете запускать приложение без Docker:

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/yourusername/university_app.git
   cd university_app
   ```

2. Создайте виртуальную среду и установите зависимости для бэкенда:
   ```
   python -m venv venv
   source venv/bin/activate  # На Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Настройте переменные окружения:
   ```
   copy docker\.env .env  # На Unix/MacOS: cp docker/.env .env
   ```

4. Убедитесь, что у вас локально запущены PostgreSQL, MongoDB и RabbitMQ, настроенные в .env файле.

5. Запустите бэкенд:
   ```
   uvicorn app.main:app --reload
   ```

6. Установите зависимости для фронтенда:
   ```
   cd frontend
   npm install
   ```

7. Запустите фронтенд:
   ```
   npm start
   ```

8. Откройте в браузере:
   - Фронтенд: `http://localhost:3000`
   - API документация: `http://localhost:8000/docs`

## Project Structure

```
university_app/
├── app/                     # Бэкенд (FastAPI)
│   ├── __init__.py
│   ├── main.py              # Точка входа FastAPI
│   ├── api/                 # API эндпоинты
│   ├── models/              # Модели базы данных
│   ├── schemas/             # Pydantic схемы
│   ├── database/            # Подключения к базам данных
│   ├── services/            # Бизнес-логика
│   └── dependencies/        # Зависимости для инъекций
├── frontend/                # Фронтенд (React)
│   ├── public/
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── services/        # Сервисы для API
│   │   └── styles/          # Стили
│   └── package.json
├── docker/                  # Конфигурации Docker
├── docker-compose.yml       # Конфигурация Docker Compose
├── requirements.txt         # Зависимости Python
└── README.md                # Этот файл
```

## API Documentation

Когда приложение запущено, вы можете получить доступ к интерактивной документации API:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

Этот проект лицензирован под MIT License - см. файл LICENSE для подробностей.
