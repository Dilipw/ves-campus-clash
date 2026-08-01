# VES Campus Clash - Backend

This is the backend API for **VES Campus Clash**, built with Laravel. It handles participant registration, gameplay session management, server-side timing, score calculation, and Story Card generation. It exposes REST APIs consumed by the React frontend.

For the full project overview, system architecture, and frontend details, see the [root README](../README.md).

## Technology Stack

- Laravel 12
- PHP 8.3+
- MySQL
- REST APIs
- Service Layer Architecture
- Laravel Validation

## Prerequisites

- PHP 8.3 or higher
- Composer
- MySQL
- Laravel CLI (optional)

## Installation & Setup

```
cd backend

composer install

cp .env.example .env

php artisan key:generate

# Configure your database credentials in the .env file

php artisan migrate

php artisan storage:link

php artisan serve
```

The API will be available at `http://localhost:8000` by default.

## Environment Variables

Create a `.env` file in the `backend/` directory using `.env.example` as a reference:

```
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ves_campus_clash
DB_USERNAME=root
DB_PASSWORD=
```

Update these values to match your local or production environment.

## Available Commands

| Command | Description |
|---|---|
| `php artisan serve` | Starts the local development server |
| `php artisan migrate` | Runs database migrations |
| `php artisan migrate:fresh` | Drops all tables and re-runs migrations |
| `php artisan storage:link` | Creates a symbolic link for public storage |
| `php artisan route:list` | Lists all registered API routes |
| `php artisan test` | Runs the test suite |

## Architecture

```
Laravel Controllers
        ↓
  Service Layer
        ↓
 Eloquent Models
        ↓
 MySQL Database
```

Controllers handle incoming requests and delegate business logic to the service layer. The service layer contains validation, score calculation, timing logic, and Story Card generation. Eloquent models handle database interactions.

## Project Structure

```
backend/
│
├── app/
│   ├── Exceptions/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   ├── Providers/
│   ├── Services/
│   └── Traits/
├── bootstrap/
├── config/
├── database/
│   └── migrations/
├── routes/
│   └── api.php
├── storage/
└── public/
```

- **Exceptions/** – Custom exception classes and centralized error handling.
- **Http/Controllers/** – Handles incoming API requests.
- **Http/Requests/** – Form request classes for validation.
- **Http/Resources/** – API resource classes for shaping JSON responses.
- **Models/** – Eloquent models representing database tables.
- **Providers/** – Service providers for bootstrapping application services.
- **Services/** – Business logic, score calculation, timing, and Story Card generation.
- **Traits/** – Reusable shared logic across models/controllers.

## Key Business Rules

- One participant can register only once.
- One gameplay session is allowed per participant.
- The server is the source of truth for timing and score calculation.
- The Story Card is generated only after the game session ends.

## Testing

```
php artisan test
```

## Notes

- Ensure the database exists and credentials in `.env` are correct before running migrations.
- Run `php artisan storage:link` after every fresh setup to serve uploaded files correctly.