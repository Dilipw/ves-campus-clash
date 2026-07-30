# 🎮 VES Campus Clash

A full-stack web application developed as part of the **VES Digital & IT Team Technical Assignment**.

The application provides an engaging campus activity where students register, play a Memory Match Challenge, receive a performance score, and download a personalized Story Card for social media sharing.

---

# 🚀 Tech Stack

## Frontend
- React JS
- Vite
- Tailwind CSS
- React Router DOM
- Axios

## Backend
- Laravel 12
- RESTful APIs
- Laravel Validation

## Database
- MySQL

---

# 📁 Project Structure

```
ves-campus-clash/

├── frontend/                 # React Application
├── backend/                  # Laravel REST API
├── docs/                     # Project Documentation
│   ├── GameDesign.md
│   ├── FeatureChecklist.md
│   ├── Architecture.md
│   └── Screenshots/
│
├── .gitignore
└── README.md
```

---

# 🎯 Features

## Landing Page

- Campaign Introduction
- Responsive UI
- Follow CTA

---

## Registration

- Student Registration
- Form Validation
- Instagram Handle
- Course Details

---

## Memory Match Challenge

- Two Game Levels
- Countdown Timer
- Score Calculation
- Combo Rewards
- Bonus Time Cards
- Mobile Friendly

---

## Result

- Final Score
- Performance Summary
- One Attempt Policy

---

## Story Card

- Personalized Story Card
- Download Option
- Instagram Ready Layout

---

# 🔄 User Flow

```
QR Scan

↓

Landing Page

↓

Follow Confirmation

↓

Registration

↓

Memory Match Game

↓

Score Calculation

↓

Result

↓

Story Card

↓

Download
```

---

# 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop
- Tablet
- Mobile Devices

---

# 🧩 Assumptions

- QR Code redirects users to the landing page.
- Users complete registration before accessing the game.
- Each participant can complete only one game session.
- Game mechanics were designed based on reasonable assumptions, as detailed game specifications were not provided.
- Story Card is generated only after successful completion.

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/ves-campus-clash.git
```

---

## Backend

```bash
cd backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan serve
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌐 Live URLs

Frontend

```
https://your-frontend-url.com
```

Backend API

```
https://your-api-url.com
```

---

# 📚 Documentation

Project documentation is available in the **docs** folder.

- Game Design
- Architecture
- Feature Checklist
- Screenshots

---

# 🚧 Challenges

- Designing the game flow based on limited functional specifications.
- Maintaining a seamless experience across desktop and mobile devices.
- Implementing a secure one-session gameplay flow.
- Creating a clean separation between frontend and backend.

---

# 🚀 Future Improvements

- Leaderboard
- Social Login
- Multiple Game Modes
- Analytics Dashboard
- Email Confirmation
- Achievement Badges
- Admin Dashboard
- Session Analytics
- Game Difficulty Levels

---

# 📌 Notes

This project was developed as a technical assignment for the **VES Digital & IT Team**.

The implementation focuses on clean architecture, responsive user experience, maintainable code, and scalable application design.

---

# 👨‍💻 Developed By

**Dilip Waghmare**

Full Stack Software Developer

Laravel | React JS | MySQL | REST APIs
