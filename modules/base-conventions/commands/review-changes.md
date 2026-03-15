# Review Changes

Review staged and unstaged changes for code quality issues before committing.

## Process

1. Run `git diff --cached` (staged) and `git diff` (unstaged) to see all changes
2. Scan for the problems listed below
3. Report findings grouped by file, with line numbers
4. Suggest specific fixes for each issue

## What to Check

### Debug Code Left Behind

- `console.log`, `console.debug`, `console.warn` (unless intentional logging)
- `debugger` statements
- Debug flags like `DEBUG = true`, `VERBOSE = true`
- Temporary test values (`password: "test123"`, `email: "foo@bar.com"`)

### Commented-Out Code

- Blocks of commented-out code (more than 2 lines)
- Commented-out imports
- Commented-out function calls or conditionals
- If the code is needed later, it should be tracked in version control, not as comments

### TODO and FIXME Without Context

- `TODO` comments should reference a ticket or issue: `// TODO(PROJ-123): handle retry`
- `FIXME` without an explanation of what's broken
- `HACK` or `WORKAROUND` without documenting why

### Common Mistakes

- Unhandled promise rejections (missing `.catch()` or `try/catch` on `await`)
- Empty catch blocks that swallow errors silently
- Hardcoded secrets, API keys, or credentials
- Files that shouldn't be committed (`.env`, `.DS_Store`, `node_modules/`)

## Output Format

```
## Review Results

### src/api/client.ts
- Line 42: `console.log('response:', data)` — remove debug log
- Line 67-72: Commented-out error handling block — delete or restore

### src/utils/helpers.ts
- Line 15: `// TODO: fix this` — add ticket reference or fix now

### Summary
Found 3 issues in 2 files.
```
