# VES Campus Clash - Frontend

This is the frontend application for **VES Campus Clash**, built with React and Vite. It handles the user interface, participant registration flow, gameplay screens, and Story Card display. It communicates with the Laravel backend through REST APIs.

For the full project overview, system architecture, and backend details, see the [root README](../README.md).

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

## Environment Variables

Create a `.env` file in the `frontend/` directory using `.env.example` as a reference:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

Update this value to point to your local or production backend URL.

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

## Notes

- This template uses [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) for Fast Refresh.
- For type-aware linting or TypeScript support, refer to the [Vite React-TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) and [typescript-eslint](https://typescript-eslint.io).

## Contact

If you have any questions regarding the project, deployment, or setup, please feel free to contact me.

**Developer:** Dilip Waghmare

**Portfolio:** https://dilipdeveloper.in

**Mobile / WhatsApp:** +91 70571 75627