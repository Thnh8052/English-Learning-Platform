# Production Roadmap

## Phase 1: Repository Foundation

- Keep generated folders out of Git: `node_modules/`, `dist/`, uploads, temp files, logs, and local environment files.
- Keep environment examples committed through `.env.example` files only.
- Keep root scripts stable for backend/frontend development and production build.
- Document architecture, roadmap, and cleanup decisions.

## Phase 2: Build And Lint Quality

- Fix current frontend ESLint errors.
- Add backend linting.
- Add Prettier or a consistent formatting command.
- Keep `npm run build` green from the repository root.
- Add CI to run install, lint, build, and later tests.

## Phase 3: API Hardening

- Standardize API responses as `{ success, message, data, errors }`.
- Add centralized validation with Joi or Zod.
- Add centralized async error handling and domain-specific error classes.
- Normalize pagination, filtering, sorting, and search for list endpoints.
- Add request logging that avoids secrets and sensitive data.

## Phase 4: Analytics

- Add teacher analytics: course progress, pending submissions, average scores, low-performing lessons, and students needing support.
- Add admin analytics: user counts by role, course activity, submission volume, completion rate, and system-level trends.
- Keep analytics service independent from the chatbot.

## Phase 5: Chatbot

- Add chatbot tools that query real user/course/submission data.
- Support questions about unfinished assignments, recent scores, feedback explanations, and study recommendations.
- Add role-based access checks so students, teachers, and admins only see permitted data.

## Phase 6: Testing And Deployment

- Add backend integration tests for auth, roles, courses, lessons, submissions, and grading.
- Add frontend smoke tests for key workflows.
- Add seed data and demo accounts.
- Deploy frontend, backend, database, and storage with documented environment variables.
