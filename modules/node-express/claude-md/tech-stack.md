## Node.js / Express Stack

This project is a Node.js REST API built with **Express**.

### Configuration

| Setting | Value |
|---------|-------|
| API prefix | `{{api_prefix}}` |
| Validation | {{validation_library}} |
| Auth strategy | {{auth_strategy}} |
| TypeScript | {{use_typescript}} |

### Architecture

```
router → controller → service → repository
```

- **Router**: HTTP method + path to controller mapping, validation middleware applied here
- **Controller**: unpack request, call service, format response — no business logic
- **Service**: all business rules, orchestration, throws `AppError` subclasses
- **Repository**: database queries only — no business logic

### Key Conventions

- All routes are under `{{api_prefix}}`
- Use `express-async-errors` — async handlers forward errors to the error middleware automatically
- Request validation via `{{validation_library}}` runs before controllers
- Success response shape: `{ data: T, meta?: M }`
- Error response shape: `{ error: string, code: string, details?: D }`
- Custom `AppError` class carries `statusCode`, `code`, and `isOperational` flag

### Security

- `helmet()` for HTTP security headers
- CORS with explicit origin allowlist (never `*` in production)
- Rate limiting on auth routes
- Startup validation of required environment variables — fail fast

### Middleware Order

```
body-parser → cors → helmet → rate-limiter → routes → 404 handler → error handler
```
