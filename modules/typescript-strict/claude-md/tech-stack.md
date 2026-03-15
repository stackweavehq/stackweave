## TypeScript Configuration

This project uses TypeScript with strict mode **{{strict_mode}}** and targets **{{target}}**.

### Compiler Options

- `"strict": true` — enables all strict type-checking options
- `"target": "{{target}}"` — output JS compatible with {{target}}
- `"moduleResolution": "{{module_resolution}}"` — module resolution strategy
- `"noUncheckedIndexedAccess": true` — array indexing returns `T | undefined`
- `"exactOptionalPropertyTypes": true` — optional props cannot be explicitly set to `undefined`
{{#if path_aliases}}
- Path aliases are configured via `baseUrl`/`paths` in tsconfig.json
{{/if}}

### Type Safety Rules

- No `any` — use `unknown` and type guards instead
- Explicit return types on all exported functions
- Prefer `interface` over `type` for object shapes
- Use `as const` for constant literals and lookup tables
- Avoid TypeScript enums; use `as const` objects instead
- Use `satisfies` to validate object literals against a type without widening
- Prefer discriminated unions over type guards for branching logic
