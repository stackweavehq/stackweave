# tsconfig.json Guide

## Recommended Strict Configuration

```jsonc
{
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,

    // Output
    "target": "{{target}}",
    "module": "{{module_resolution}}",
    "moduleResolution": "{{module_resolution}}",

    // Interop
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",

    // Skip type checking node_modules
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Key Strict Flags Explained

### `strict: true`

Enables all strict type-checking flags in one shot:
- `strictNullChecks` — `null` and `undefined` are distinct types
- `strictFunctionTypes` — function parameter types are checked contravariantly
- `strictBindCallApply` — `bind`, `call`, `apply` are strictly typed
- `strictPropertyInitialization` — class properties must be initialized
- `noImplicitAny` — error on expressions with implied `any`
- `noImplicitThis` — error on `this` with implied `any`
- `alwaysStrict` — emit `"use strict"` in output

### `noUncheckedIndexedAccess: true`

Array and object index access returns `T | undefined` instead of `T`.
This catches a common class of runtime errors.

```ts
const arr = [1, 2, 3];
const val = arr[5]; // Type: number | undefined (not number)
if (val !== undefined) {
  console.log(val * 2); // Safe
}
```

### `noImplicitReturns: true`

Every code path in a function must return a value if any path does.
Catches forgotten return statements in branches.

### `exactOptionalPropertyTypes: true`

Optional properties cannot be explicitly set to `undefined`.
This distinguishes "missing" from "present but undefined".

```ts
interface Config {
  debug?: boolean;
}
// With exactOptionalPropertyTypes:
const cfg: Config = { debug: undefined }; // Error!
const cfg2: Config = {}; // OK — debug is missing
```

## Multiple Config Pattern

Use a base config with project-specific extensions:

```
tsconfig.json          # Base config (shared settings)
tsconfig.app.json      # App source — extends base, includes src/
tsconfig.test.json     # Tests — extends base, includes tests/, looser settings
tsconfig.build.json    # Build — extends base, emit settings
```

### Base Config (tsconfig.json)

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "target": "{{target}}",
    "moduleResolution": "{{module_resolution}}",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### App Config (tsconfig.app.json)

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

### Test Config (tsconfig.test.json)

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

{{#if path_aliases}}
## Path Aliases

Configure path aliases to avoid deep relative imports:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

Usage:

```ts
// Instead of:
import { Button } from '../../../components/Button';

// Use:
import { Button } from '@/components/Button';
```

**Important**: Path aliases are a TypeScript-only feature. Your bundler
(webpack, vite, tsup, esbuild) must also be configured to resolve them.
For Jest, configure `moduleNameMapper` in `jest.config.ts`.
{{/if}}

## Module Resolution

### `"bundler"` (Recommended for Apps)

Use when a bundler (webpack, vite, esbuild, tsup) handles module resolution.
Supports `package.json` `exports` field and extensionless imports.

### `"node16"` / `"nodenext"` (For Libraries and Node.js)

Use for packages published to npm or Node.js applications without a bundler.
Requires explicit file extensions in imports (`.js` for `.ts` files).

```ts
// With node16/nodenext:
import { helper } from './utils.js'; // .js extension required (even for .ts files)
```
