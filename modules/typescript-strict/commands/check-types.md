# Check Types

Run the TypeScript compiler to check for type errors without emitting output.

## Command

```bash
npx tsc --noEmit
```

## With a Specific Config

```bash
# Check using a specific tsconfig
npx tsc --noEmit -p tsconfig.app.json

# Check tests separately
npx tsc --noEmit -p tsconfig.test.json
```

## Reporting

After running `tsc --noEmit`, report results clearly:
- If no errors: "Type check passed — no errors found."
- If errors: List each error with file, line number, and error message. Group by file.

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `TS2322: Type 'X' is not assignable to type 'Y'` | Type mismatch | Check the expected type and adjust the value or add a type guard |
| `TS7006: Parameter implicitly has an 'any' type` | Missing type annotation | Add explicit parameter types |
| `TS2532: Object is possibly 'undefined'` | Accessing a nullable value | Add a null check or use optional chaining (`?.`) |
| `TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'` | Wrong argument type | Check the function signature and adjust the argument |
| `TS18046: 'x' is of type 'unknown'` | Using `unknown` without narrowing | Add a type guard or assertion before use |
| `TS2554: Expected N arguments, but got M` | Wrong number of arguments | Check the function signature |

## Watch Mode

For continuous type checking during development:

```bash
npx tsc --noEmit --watch
```
