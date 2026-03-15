# TypeScript Rules

Strict mode enabled: {{strict_mode}}
Compilation target: {{target}}

## Core Principles

### No `any`

Never use `any`. Use `unknown` for truly unknown types and narrow with type guards.

```ts
// bad
function parse(input: any) { ... }

// good
function parse(input: unknown): MyType {
  if (!isMyType(input)) throw new Error('invalid input');
  return input;
}
```

### Explicit Return Types

All exported functions and methods must have explicit return type annotations.
Internal helpers may omit them only when the return type is trivially inferred.

```ts
// bad
export function buildUrl(base: string, path: string) {
  return `${base}/${path}`;
}

// good
export function buildUrl(base: string, path: string): string {
  return `${base}/${path}`;
}
```

### Strict Null Checks

With `strict_mode: {{strict_mode}}`, `null` and `undefined` are not assignable to other types.
Always handle nullability explicitly.

```ts
// bad
function getUser(id: string) {
  return users.find(u => u.id === id); // User | undefined, not just User
}

// good
function getUser(id: string): User | undefined {
  return users.find(u => u.id === id);
}
```

### Interfaces Over Type Aliases for Object Shapes

Prefer `interface` for describing object shapes. Use `type` for unions, intersections, mapped types, and utility types.

```ts
// prefer
interface User {
  id: string;
  name: string;
}

// acceptable for unions
type Status = 'active' | 'inactive' | 'pending';
```

### Use `as const` for Literal Objects

When an object or array is used as a lookup table or set of constants, assert `as const` to prevent widening.

```ts
const LAYERS = ['base', 'lang', 'stack', 'infra', 'pattern', 'project'] as const;
type LayerName = typeof LAYERS[number];
```

### Avoid Enums

Prefer const objects over TypeScript enums. Enums generate runtime code and have surprising structural typing behaviour.

```ts
// bad
enum Direction { Up, Down }

// good
const Direction = { Up: 'Up', Down: 'Down' } as const;
type Direction = typeof Direction[keyof typeof Direction];
```

### Compilation Target: {{target}}

All code should be compatible with `{{target}}`. Avoid stage-3 proposals or platform APIs
not available in that target without explicit polyfills.
