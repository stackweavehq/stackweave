## TypeScript Configuration

This project uses TypeScript with strict mode **{{strict_mode}}** and targets **{{target}}**.

Key compiler options in `tsconfig.json`:

- `"strict": true` — enables all strict type-checking options
- `"target": "{{target}}"` — output JS compatible with {{target}}
- `"noUncheckedIndexedAccess": true` — array indexing returns `T | undefined`
- `"exactOptionalPropertyTypes": true` — optional props cannot be explicitly set to `undefined`

### Type Safety Rules

- No `any` — use `unknown` and type guards instead
- Explicit return types on all exported functions
- Prefer `interface` over `type` for object shapes
- Use `as const` for constant literals and lookup tables
- Avoid TypeScript enums; use `as const` objects instead
