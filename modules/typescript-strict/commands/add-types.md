# Add Types

Add TypeScript type annotations to an untyped JavaScript file or function.

## Process

1. Rename the file from `.js`/`.jsx` to `.ts`/`.tsx`
2. Add explicit types to all function parameters and return types
3. Define interfaces for object shapes used in the file
4. Replace `any` with proper types or `unknown` with type guards
5. Run `npx tsc --noEmit` to verify the file compiles cleanly

## Conventions

Follow these rules when adding types:

- **Exported functions**: Always add explicit return type annotations
- **Parameters**: Always type all parameters; never rely on implicit `any`
- **Object shapes**: Define an `interface` and name it descriptively (e.g., `UserProfile`, not `Data`)
- **Union types**: Use `type` aliases for unions (e.g., `type Status = 'active' | 'inactive'`)
- **Arrays**: Prefer `ReadonlyArray<T>` or `readonly T[]` for arrays that should not be mutated
- **Nullability**: Use `T | null` for intentional absence, `T | undefined` for optional values
- **Type imports**: Use `import type { ... }` for type-only imports

## Example

```ts
// Before (JavaScript)
function processUsers(users, filter) {
  return users.filter(u => u.role === filter).map(u => u.name);
}

// After (TypeScript)
interface User {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'guest';
}

function processUsers(users: readonly User[], filter: User['role']): string[] {
  return users.filter(u => u.role === filter).map(u => u.name);
}
```

## Gradual Migration Tips

- Start with shared utilities and types — they propagate type safety outward
- Use `// @ts-expect-error` (not `@ts-ignore`) for temporary suppressions, with a comment explaining why
- Never add `as any` to silence errors — fix the underlying type issue
