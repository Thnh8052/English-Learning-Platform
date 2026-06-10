# English Learning Platform

Full-stack web application for managing English courses, lessons, quizzes, speaking practice, writing submissions, and role-based learning workflows for students, teachers, and admins.

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios, CSS Modules, Recharts, Framer Motion
- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT, Multer, Cloudinary, SendGrid
- AI/File processing: DeepSeek/Groq integrations, speech-to-text flow, PDF/DOCX lesson parsing

## Production-Oriented Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- app.js              # Express app, middleware, routes, error handling
|   |   |-- server.js           # DB connection and HTTP server bootstrap
|   |   |-- config/             # Database and third-party service config
|   |   |-- controllers/        # Request handlers
|   |   |-- middleware/         # Auth, role, upload middleware
|   |   |-- models/             # Mongoose schemas
|   |   |-- routes/             # API route definitions
|   |   |-- services/           # Business logic and AI scoring services
|   |   `-- utils/              # Shared backend utilities
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- components/         # Reusable UI components
|   |   |-- constants/          # Shared constants
|   |   |-- contexts/           # React context providers
|   |   |-- pages/              # Route-level screens by domain/role
|   |   |-- routes/             # App router
|   |   |-- services/           # API clients
|   |   `-- utils/              # Formatting and validation helpers
|   |-- public/
|   `-- .env.example
|-- docs/
|   |-- CV_PROJECT_SUMMARY.md
|   `-- IMPROVEMENTS.md
|-- package.json               # Root workspace commands
`-- README.md
```

## Getting Started

1. Install dependencies:

```bash
npm install --workspace backend
npm install --workspace frontend
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Run development servers:

```bash
npm run dev:api
npm run dev:web
```

## Useful Scripts

- `npm run dev:api`: run the Express API with Nodemon
- `npm run dev:web`: run the Vite frontend
- `npm run build`: build the frontend for production
- `npm run lint`: run frontend linting
- `npm run start`: start the backend in production mode

## CV Summary

See [docs/CV_PROJECT_SUMMARY.md](docs/CV_PROJECT_SUMMARY.md) for a short CV-ready project description and bullet points.

## Suggested Improvements

See [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md) for prioritized improvements before publishing this project on a CV or portfolio.
