# Express Patterns

API prefix: **{{api_prefix}}**
Validation library: **{{validation_library}}**
Auth strategy: **{{auth_strategy}}**
TypeScript: **{{use_typescript}}**

---

## Middleware Ordering

Middleware order in Express is **execution order** — it is not arbitrary. Always mount in this sequence:

1. `body-parser` / `express.json()` — parse request bodies before anything reads `req.body`
2. `cors` — CORS headers must be set before routes handle the request
3. `helmet` — security headers
4. Rate limiter — before routes, after CORS (so CORS preflight isn't rate-limited)
5. Routes — application logic
6. 404 catch-all — after all routes, before error handler
7. Error handler — **last**, with 4-parameter signature `(err, req, res, next)`

```typescript
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(rateLimiter);

app.use('{{api_prefix}}', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler); // must be last
```

1. **Never reorder** these — body parser after routes means `req.body` is always `undefined` in route handlers.

---

## Route Prefix

2. **All routes live under `{{api_prefix}}`** — no bare `/users`, always `{{api_prefix}}/users`.
3. Register routes via a single router mounted at `{{api_prefix}}`. Never mount routes at the app level directly.

---

## Service Layer Architecture

4. **Never put business logic in route handlers**. The only code in a controller is: validate → call service → format response. The service layer contains all business rules.

```
router → controller → service → repository
```

- **Router**: maps HTTP methods + paths to controller functions
- **Controller**: validates input, calls service, returns response
- **Service**: business logic, orchestration, no HTTP concerns
- **Repository**: database queries, no business logic

```typescript
// bad — business logic in route handler
router.post('/orders', async (req, res) => {
  const items = req.body.items;
  if (items.length === 0) return res.status(400).json({ error: 'No items' });
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order = await db.orders.create({ userId: req.user.id, items, total });
  await emailService.sendConfirmation(req.user.email, order);
  res.status(201).json(order);
});

// good — thin controller
router.post('/orders', validate(createOrderSchema), createOrder);

// controller
async function createOrder(req: Request, res: Response): Promise<void> {
  const order = await orderService.create(req.user.id, req.body);
  res.status(201).json({ data: order });
}
```

---

## Async Route Handlers

5. **Unhandled promise rejections crash the server** in Node.js (or emit a warning in older versions). Every async route handler must handle errors.

**Option A — `express-async-errors` package** (recommended): import once in your app entry point, then async route handlers automatically forward errors to the error middleware.

```typescript
// app.ts — import once at the top
import 'express-async-errors';
```

**Option B — manual async wrapper:**

```typescript
function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get('/users/:id', asyncHandler(getUserById));
```

6. **Never call `res.json()` after `next(err)` in the same handler** — the response will already be committed.

---

## Request Validation

7. **Validate every route that accepts input** using **{{validation_library}}**. Validation happens in middleware before the controller runs.
8. **Reject invalid requests with 400 before any business logic executes** — do not let malformed data reach the service layer.

### Validation Middleware Pattern

Create a reusable `validate` middleware that accepts a {{validation_library}} schema, validates `req.body`, and either passes the parsed data forward or returns a 400 error with field-level details.

```typescript
// Apply validation as middleware before the controller
router.post('/users', validate(createUserSchema), createUser);
```

The validation middleware should:
1. Parse/validate `req.body` against the schema
2. On success: replace `req.body` with the parsed and coerced data, then call `next()`
3. On failure: respond with `400` and a `VALIDATION_ERROR` body containing field-level error details

See the **Express Error Handling** guide for full {{validation_library}} validation middleware implementations with error formatting.

---

## Response Format

9. **Consistent response envelope** — all responses use the same shape:

Success:
```json
{ "data": <T>, "meta": { "page": 1, "total": 42 } }
```

Error:
```json
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE", "details": {} }
```

10. **HTTP status codes** — use the correct code every time:

| Status | When to use |
|--------|-------------|
| 200    | GET, PUT success |
| 201    | POST success (resource created) |
| 204    | DELETE success (no body) |
| 400    | Bad request / validation error |
| 401    | Unauthenticated (no valid credentials) |
| 403    | Authenticated but not authorized |
| 404    | Resource not found |
| 409    | Conflict (duplicate, state mismatch) |
| 422    | Unprocessable entity (semantic error) |
| 500    | Internal server error |

---

## Security

11. **`helmet()`** must be applied to set secure HTTP headers (`X-Frame-Options`, `Content-Security-Policy`, etc.). Never disable it in production.
12. **CORS**: configure an explicit allowlist of origins — never `origin: '*'` in production. In development, allow `localhost` explicitly.
13. **Rate limiting on auth routes**: `/login`, `/register`, `/forgot-password`, `/token` must all have a strict rate limiter (e.g., 5 attempts per 15 minutes per IP).
14. **Validate `Content-Type`**: routes that expect JSON must reject requests without `Content-Type: application/json`.
15. **No secrets in code**: all secrets via `process.env`. Validate at startup — fail fast if required env vars are missing.

```typescript
// startup validation
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

---

## Auth Strategy: {{auth_strategy}}

16. Authentication is handled via **{{auth_strategy}}**. Auth middleware verifies credentials and attaches the authenticated user to `req.user` before controllers run.
17. Protected routes apply auth middleware explicitly. Never rely on route order alone for security.

```typescript
// jwt example
router.get('/profile', requireAuth, getProfile);
router.post('/orders', requireAuth, requireRole('member'), validate(schema), createOrder);
```

---

## Error Handler Middleware

```typescript
import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.statusCode ?? 500;
  const isOperational = err.isOperational ?? false;

  if (!isOperational) {
    // unexpected error — log full details
    console.error('[Unhandled error]', err);
  }

  const body = {
    error: isOperational ? err.message : 'Internal server error',
    code: err.code ?? 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(status).json(body);
};
```
