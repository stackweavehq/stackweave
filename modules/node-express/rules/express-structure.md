# Express Project Structure

## Directory Layout

```
src/
├── app.ts                  # Express app factory (no listen() call here)
├── server.ts               # Entry point — calls app.listen()
├── routes/
│   ├── index.ts            # Barrel — mounts all routers under {{api_prefix}}
│   ├── users.ts            # /users routes
│   └── orders.ts           # /orders routes
├── controllers/
│   ├── index.ts            # Barrel export
│   ├── users.controller.ts
│   └── orders.controller.ts
├── services/
│   ├── index.ts
│   ├── users.service.ts
│   └── orders.service.ts
├── repositories/
│   ├── index.ts
│   ├── users.repository.ts
│   └── orders.repository.ts
├── middleware/
│   ├── index.ts
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── rate-limit.middleware.ts
├── models/
│   ├── index.ts
│   └── errors.ts           # Custom error classes
├── config/
│   └── env.ts              # Validated environment config
└── types/
    └── express.d.ts        # Augment Express Request type (req.user, etc.)
```

---

## Dependency Rules

1. **Route files only import controllers** — never services or repositories directly.
2. **Controllers only import services** — never repositories or database clients directly.
3. **Services only import repositories** and other services.
4. **Repositories only import the database client** — no business logic.
5. **Middleware** may import config and models (error classes) but not services.

Violating these rules creates tight coupling that makes testing and refactoring difficult.

---

## Barrel Exports

Every directory that is imported from outside must have an `index.ts` that re-exports its public interface:

```typescript
// src/services/index.ts
export { UsersService } from './users.service';
export { OrdersService } from './orders.service';
```

Import from the barrel, not from individual files:

```typescript
// good
import { UsersService } from '../services';

// bad — fragile, exposes internal structure
import { UsersService } from '../services/users.service';
```

---

## Custom Error Classes

Define a base `AppError` class with `statusCode`, `code`, and `isOperational`:

```typescript
// src/models/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
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
```

Throw these from services and let the error handler middleware format the response:

```typescript
// users.service.ts
async function getUserById(id: string): Promise<User> {
  const user = await usersRepository.findById(id);
  if (!user) throw new NotFoundError('User', id);
  return user;
}
```

---

## App Factory Pattern

Separate the app factory from the server entry point so the app can be imported in tests without starting a listener:

```typescript
// src/app.ts
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }));
  app.use(helmet());
  app.use('{{api_prefix}}', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// src/server.ts
import { createApp } from './app';
const app = createApp();
app.listen(process.env.PORT ?? 3000, () => console.log('Listening'));
```
