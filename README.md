# VES Campus Clash

## 1. Project Overview

VES Campus Clash is a full stack web application built to deliver an interactive campus gaming experience. Participants access the platform via a QR code, register, and take part in a single timed gameplay session. The backend is responsible for enforcing game rules, calculating scores, and maintaining timing integrity, while the frontend delivers a responsive and engaging user interface across devices. At the end of each session, a personalized Story Card is generated for the participant.

## 2. Live Demo

**Live Application**
https://ves.sundigit.in/

## 3. GitHub Repositories

**Frontend Repository**
https://github.com/Dilipw/ves-campus-clash-frontend

**Backend Repository**
https://github.com/Dilipw/ves-campus-clash-backend

## 4. Technology Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- React Router
- Axios
- React Hook Form


### Backend
- Laravel 12
- PHP 8.3+
- REST APIs
- Service Layer Architecture
- Laravel Validation

### Database
- MySQL

### Tools
- Git
- GitHub
- Postman
- Composer
- NPM

## 5. System Architecture

```
                User
                  │
                  ▼
         React Frontend (Vite)
                  │
             Axios REST APIs
                  │
                  ▼
         Laravel 12 Backend
                  │
      ┌───────────┴───────────┐
      │                       │
 Controllers           Request Validation
      │
      ▼
 Service Layer
      │
      ▼
 Eloquent ORM
      │
      ▼
     MySQL
```

The frontend is responsible for user interface and user interactions. Laravel handles business logic, validation, score calculation, timing, and database operations. Communication between the frontend and backend is performed using REST APIs that return JSON responses.

## 6. Project Structure

```
frontend/
│
├── dist/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   └── App.css
├── package.json
└── vite.config.js

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
├── storage/
└── public/
```

## 7. Features

- QR code based access to the game landing page
- One-time participant registration
- Single attempt gameplay session per participant
- Server-side timing and score validation
- Automatic Story Card generation after session completion
- Responsive UI for desktop and mobile devices
- Installable as a Progressive Web App (PWA) on both mobile and desktop
- RESTful API communication between frontend and backend

**Note:** The application is installable as a PWA on mobile and desktop, but it requires an active internet connection to run. Offline functionality is not currently supported.

## 8. Installation & Setup

### Backend

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

### Frontend

```
cd frontend

npm install

npm run dev
```

## 9. API Configuration

The frontend communicates with the backend through REST API endpoints configured via environment variables.

**Backend (.env)**
```
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ves_campus_clash
DB_USERNAME=root
DB_PASSWORD=
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:8000/api
```

Update these values to match your local or production environment before running the application.

## 10. Assumptions

- The QR code redirects users to the landing page.
- One participant can register only once.
- One gameplay session is allowed per participant.
- The Story Card is generated after the game session ends.
- The server is the source of truth for timing and score calculation.

## 11. Challenges Faced

- Designing the complete game flow from functional requirements.
- Synchronizing frontend and backend timer logic.
- Preventing client-side score manipulation.
- Implementing a one-attempt gameplay flow.
- Maintaining responsive UI across desktop and mobile devices.

## 12. Future Improvements

- Admin Dashboard
- Leaderboard
- Analytics Dashboard
- Social Login
- Email Notifications
- Achievement Badges
- Multiple Difficulty Levels
- Real-time Statistics
- Offline Support for PWA
- Docker Deployment
- CI/CD Pipeline
- Redis Caching


## 13. Deployment

Hosting Platform

- Shared Hosting

Deployment Strategy

- GitHub Version Control
- Git over SSH
- Manual Deployment using git pull
- Composer Dependency Management
- React Production Build using Vite
- HTTPS Enabled

## 14. Security

- Server-side score calculation
- Server-side timer validation
- Input validation using Laravel Form Requests
- REST API validation
- One gameplay session per participant
- UUID-based game sessions


## 15. Developer

**Dilip Waghmare**
Full Stack Software Developer
Laravel | PHP | React | Tailwind CSS | MySQL | REST APIs

The project follows a decoupled architecture where the React frontend and Laravel backend are maintained independently and communicate through REST APIs. This separation improves scalability, maintainability, and allows future integration with mobile applications.

## 16. Contact

If you have any questions regarding the project, deployment, or setup, please feel free to contact me.

**Developer:** Dilip Waghmare

**Portfolio:** https://dilipdeveloper.in

**Mobile / WhatsApp:** +91 70571 75627