# Architecture

## Current Shape

This repository is organized as a JavaScript monorepo with two applications:

- `frontend/`: React + Vite single-page application.
- `backend/`: Node.js + Express REST API backed by MongoDB/Mongoose.

The backend currently follows a layered MVC-style structure:

```text
backend/src/
|-- app.js          # Express app configuration, middleware, routes, error handler
|-- server.js       # Database connection and HTTP server bootstrap
|-- config/         # Database and third-party service setup
|-- controllers/    # Request handlers
|-- middleware/     # Auth, role, and upload middleware
|-- models/         # Mongoose schemas
|-- routes/         # API route definitions
|-- services/       # Business logic, AI integrations, scoring logic
`-- utils/          # Shared utilities
```

The frontend is organized by route-level pages and reusable components:

```text
frontend/src/
|-- components/     # Shared UI and feature components
|-- contexts/       # React context providers
|-- pages/          # Screens grouped by domain/role
|-- routes/         # App routing
|-- services/       # API client setup
|-- constants/      # Shared constants
`-- utils/          # Formatting and validation helpers
```

## Target Production Boundaries

The next backend restructuring step should move toward domain modules without changing the database yet:

```text
backend/src/modules/
|-- auth/
|-- users/
|-- courses/
|-- lessons/
|-- submissions/
|-- grading/
|-- analytics/
`-- ai/
```

Each module should own its route, controller, service, validation schema, and data access logic. This keeps future work such as PostgreSQL/Prisma migration, analytics dashboards, and chatbot tools from spreading logic across unrelated files.

## Analytics And Chatbot Direction

Analytics should be implemented as a normal backend service first, then exposed to both dashboards and the chatbot:

```text
Database -> Analytics Service -> Analytics API -> Teacher/Admin Dashboards
Database -> Analytics Service -> Chatbot Tools -> AI Response
```

This keeps dashboards usable even if the AI provider is unavailable.
