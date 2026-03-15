# TypeScript Patterns

## 1. Prefer `unknown` Over `any`

Never use `any`. If you must handle a truly unknown type, use `unknown` and narrow it.
If `any` is absolutely unavoidable (e.g., third-party library constraint), add a comment explaining why.

```ts
// bad
function handle(data: any) { return data.value; }

// good
function handle(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data');
}
```

## 2. Discriminated Unions

Prefer discriminated unions over type guards for branching logic.
Add a `type` or `kind` field that TypeScript can narrow on.

```ts
// good — TypeScript narrows automatically in switch/if
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rect': return shape.width * shape.height;
  }
}
```

## 3. Interface vs Type

- Use `interface` for object shapes that may be extended or implemented.
- Use `type` for unions, intersections, mapped types, and utility types.

```ts
// interface for object shapes
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// type for unions and computed types
type Status = 'active' | 'inactive' | 'pending';
type UserWithStatus = UserProfile & { status: Status };
```

## 4. The `satisfies` Operator

Use `satisfies` to validate that an object matches a type without widening it.
This preserves literal types while ensuring type safety.

```ts
type Theme = Record<string, string>;

// bad — widened to Record<string, string>, loses key info
const colors: Theme = { primary: '#007bff', danger: '#dc3545' };

// good — validated against Theme, keeps literal keys
const colors = {
  primary: '#007bff',
  danger: '#dc3545',
} satisfies Theme;

colors.primary; // type: string (and key is known to exist)
```

## 5. Const Assertions

Use `as const` for literal values, lookup tables, and configuration objects.

```ts
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof HTTP_METHODS[number]; // 'GET' | 'POST' | 'PUT' | 'DELETE'

const STATUS_CODES = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;
type StatusCode = typeof STATUS_CODES[keyof typeof STATUS_CODES]; // 200 | 404 | 500
```

## 6. Template Literal Types

Use template literal types to enforce string patterns at the type level.

```ts
type EventName = `on${Capitalize<string>}`;
type CssUnit = `${number}${'px' | 'rem' | 'em' | '%'}`;
type ApiRoute = `/api/${string}`;

function on(event: EventName, handler: () => void): void { ... }
on('onClick', handler); // OK
on('click', handler);   // Error
```

## 7. Branded Types

Use branded types for domain primitives to prevent mixing incompatible values.

```ts
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };

function createUserId(id: string): UserId {
  return id as UserId;
}

function getUser(id: UserId): User { ... }

const userId = createUserId('u-123');
const orderId = 'o-456' as OrderId;

getUser(userId);  // OK
getUser(orderId); // Error — OrderId is not assignable to UserId
```

## 8. Avoid Enums

Prefer const objects with `as const` over TypeScript enums.
Enums generate runtime code and have surprising structural typing behavior.

```ts
// bad
enum Role { Admin = 'admin', Member = 'member' }

// good
const Role = { Admin: 'admin', Member: 'member' } as const;
type Role = typeof Role[keyof typeof Role]; // 'admin' | 'member'
```

## 9. Generic Constraints

Always constrain type parameters. Unconstrained generics accept `any` shape.

```ts
// bad — T is unconstrained
function getId<T>(obj: T): string { return obj.id; } // Error: Property 'id' does not exist

// good — T is constrained
function getId<T extends { id: string }>(obj: T): string {
  return obj.id;
}
```

### Default Type Parameters

Provide defaults when a generic has a common case:

```ts
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}
```

## 10. Utility Type Patterns

### Pick and Omit

```ts
// Create a subset of an interface
type UserSummary = Pick<User, 'id' | 'name'>;
type UserWithoutEmail = Omit<User, 'email'>;
```

### Partial and Required

```ts
// All fields optional (useful for update payloads)
type UpdateUser = Partial<User>;

// All fields required (useful for validated data)
type ValidatedConfig = Required<Config>;
```

### Record

```ts
// Type-safe dictionaries
type UserMap = Record<UserId, User>;
type FeatureFlags = Record<string, boolean>;
```

### Extract and Exclude

```ts
type StringOrNumber = string | number | boolean;
type OnlyStrings = Extract<StringOrNumber, string>; // string
type NoStrings = Exclude<StringOrNumber, string>;   // number | boolean
```

### ReturnType and Parameters

```ts
// Derive types from existing functions
type CreateUserResult = ReturnType<typeof createUser>;
type CreateUserArgs = Parameters<typeof createUser>;
```
