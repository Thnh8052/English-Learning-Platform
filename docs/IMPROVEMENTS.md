# Improvements Before Adding to CV

## High Priority

- Add automated tests for authentication, role permissions, course CRUD, lesson creation, submission grading, and AI scoring services.
- Keep generated files out of Git history and rely on workspace lockfiles for reproducible installs.
- Add a production deployment guide with environment variables, build commands, and sample hosting architecture.
- Add centralized request validation for all API inputs using Joi or express-validator consistently.
- Replace debug logging of sensitive service status with structured, production-safe logging.

## Medium Priority

- Add OpenAPI/Swagger documentation for the REST API.
- Add pagination, sorting, and filtering standards for list endpoints.
- Improve frontend state management around loading, empty, and error states.
- Normalize naming conventions for React components and CSS modules.
- Add CI workflow for linting, dependency install, and frontend build.

## Portfolio Polish

- Add screenshots or a short demo video to the README.
- Add a seed script with sample users, courses, lessons, and submissions.
- Add a clear feature matrix for student, teacher, and admin roles.
- Add deployment links for frontend and backend if available.
- Add security notes covering JWT expiry, CORS policy, upload validation, and rate limiting.
