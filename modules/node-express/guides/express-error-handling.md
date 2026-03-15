# Express Error Handling Guide

Robust error handling in Express requires a consistent strategy for catching, classifying, and formatting errors — from validation failures to unexpected runtime exceptions.

---

## The Error Handler Middleware

Express identifies an error handler by its **4-parameter signature**: `(err, req, res, next)`. It must be registered **last**, after all routes and other middleware.

```typescript
import { ErrorRequestHandler } from 'express';
import { AppError } from '../models/errors';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Determine status code
  const status = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Log non-operational errors with full details
  if (!isOperational) {
    console.error({
      message: 'Unexpected error',
      error: err,
      path: req.path,
      method: req.method,
    });
  }

  const body = {
    error: isOperational ? err.message : 'Internal server error',
    code: err.code ?? 'INTERNAL_ERROR',
    // Include stack trace only in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  res.status(status).json(body);
};
```

---

## Custom AppError Class

A typed error hierarchy gives the error handler the information it needs to format the response correctly.

```typescript
// src/models/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    /** true = expected error (404, 400, etc.), false = bug/crash */
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience subclasses
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} "${id}" not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

---

## express-async-errors vs Manual try-catch

### express-async-errors (recommended)

Install once, import once, forget about it:

```bash
npm install express-async-errors
```

```typescript
// src/app.ts — first import in the file
import 'express-async-errors';
```

**How it works**: monkey-patches Express's `router.Layer.prototype.handle_request` to wrap async handlers and route errors to the next error handler automatically.

**Trade-offs**:
- Pros: zero boilerplate in route handlers, works with third-party middleware
- Cons: it's a monkey patch — review carefully when upgrading Express versions

### Manual Async Wrapper

If you prefer no monkey patching:

```typescript
import { RequestHandler } from 'express';

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get('/users/:id', asyncHandler(getUserById));
```

**Trade-offs**:
- Pros: explicit, no magic, works in all environments
- Cons: must wrap every async handler — easy to forget

---

## Validation Error Formatting

This project uses **{{validation_library}}** for request validation. Below are `validate` middleware implementations for each supported library. Use the one matching your configured `validation_library`.

### Zod

```typescript
import { ZodSchema } from 'zod';
import { RequestHandler } from 'express';

export function validate(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}
```

### Joi

```typescript
import Joi from 'joi';
import { RequestHandler } from 'express';

export function validate(schema: Joi.Schema): RequestHandler {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      });
    }
    req.body = value;
    next();
  };
}
```

### Yup

```typescript
import { ObjectSchema, ValidationError } from 'yup';
import { RequestHandler } from 'express';

export function validate(schema: ObjectSchema<any>): RequestHandler {
  return async (req, res, next) => {
    try {
      req.body = await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
      next();
    } catch (err) {
      if (err instanceof ValidationError) {
        const details: Record<string, string[]> = {};
        for (const e of err.inner) {
          const field = e.path ?? 'unknown';
          details[field] = details[field] ?? [];
          details[field].push(e.message);
        }
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
        });
      }
      next(err);
    }
  };
}
```

---

## 404 Catch-All Route

Register after all application routes, before the error handler:

```typescript
// src/middleware/not-found.middleware.ts
import { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
};
```

---

## Production vs Development Error Responses

```typescript
// Development: include stack trace and full error object
if (process.env.NODE_ENV !== 'production') {
  body.stack = err.stack;
  body.originalError = err.message;
}

// Production: never expose internals for 500 errors
// For operational errors (AppError.isOperational = true), the message is safe to show
// For programmer errors (crashes, bugs), show generic "Internal server error"
```

---

## Uncaught Exception and Unhandled Rejection Handlers

Register these in `src/server.ts` (the entry point, not the app factory):

```typescript
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] Shutting down', err);
  process.exit(1); // mandatory: process is in unknown state
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] Shutting down', reason);
  process.exit(1); // treat as fatal — unhandled rejections are bugs
});
```

In production, use a process supervisor (PM2, Kubernetes, Docker restart policy) that automatically restarts the process after a crash. Do not try to recover from an unhandled exception — the process is in an unknown state.
