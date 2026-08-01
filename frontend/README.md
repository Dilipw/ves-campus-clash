# VES Campus Clash - Frontend

This is the frontend application for **VES Campus Clash**, built with React and Vite. It handles the user interface, participant registration flow, gameplay screens, and Story Card display. It communicates with the Laravel backend through REST APIs.

For the complete project overview, system architecture, deployment details, and backend implementation, please refer to the [root README](../README.md).

## Technology Stack

- React 19
- Vite
- Tailwind CSS 4
- React Router
- Axios
- React Hook Form


## Prerequisites

- Node.js 18+
- NPM

## Installation & Setup

```
cd frontend

npm install

npm run dev
```

The app will be available at `http://localhost:5173` by default.

## API Configuration

The frontend API base URL is configured in:

`src/services/api.js`

If you are running the project locally, update:

```javascript
baseURL: "http://localhost:8000/api/v1"
```

For production deployment, configure it with your production API endpoint.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server with hot module replacement |
| `npm run build` | Builds the app for production |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Runs ESLint checks |

## Project Structure

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
```

- **assets/** – Images, icons, and static media.
- **components/** – Reusable UI components.
- **config/** – App-level configuration (API base URL, constants, etc.).
- **context/** – React Context providers for global state.
- **pages/** – Route-level page components.
- **routes/** – Route definitions and navigation setup.
- **services/** – API call handlers using Axios.
- **styles/** – Global and shared styling files.
- **utils/** – Helper functions and utilities.

## Progressive Web App

This application is installable as a PWA on both mobile and desktop devices. An active internet connection is required to use the app; offline functionality is not currently supported.


## Contact

If you have any questions regarding the project, deployment, or setup, please feel free to contact me.

**Developer:** Dilip Waghmare

**Portfolio:** https://dilipdeveloper.in

**Mobile / WhatsApp:** +91 70571 75627