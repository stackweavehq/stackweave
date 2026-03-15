# Conventional Commits

This project enforces the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

Maximum subject line length: **{{max_subject_length}} characters**.
Scope required: **{{require_scope}}**.
Allowed scopes: **{{scopes}}** (empty = any scope permitted).

---

## Commit Message Format

```
<type>[(<scope>)]: <subject>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type       | When to use                                                              |
|------------|--------------------------------------------------------------------------|
| `feat`     | Introduces a new feature visible to users or consumers of the API        |
| `fix`      | Corrects a bug — something was broken and now it works                   |
| `chore`    | Maintenance that does not affect production behaviour (deps, tooling)    |
| `refactor` | Code restructuring with no behaviour change and no new feature           |
| `docs`     | Documentation only: READMEs, JSDoc, inline comments, guides             |
| `test`     | Adding, fixing, or reorganising tests; no production code changes        |
| `ci`       | CI/CD pipeline config: GitHub Actions, Dockerfile, build scripts         |
| `perf`     | Performance improvement — measurably faster, smaller, or more efficient  |
| `build`    | Changes to the build system or external dependencies (webpack, tsup)     |
| `style`    | Whitespace, formatting, semicolons — zero logic change                   |

Choose the type that best describes the **primary intent** of the commit. If a commit does multiple things, split it into separate commits.

---

## Subject Line Rules

1. **Imperative mood**: write as a command — "add login page", not "added login page" or "adds login page".
2. **Lowercase after the colon**: `fix(auth): handle token expiry` — not `Fix(auth): Handle token expiry`.
3. **No period at the end**: `feat: add dark mode` — not `feat: add dark mode.`
4. **Max {{max_subject_length}} characters** — count from `type` through the last character. Abbreviate rather than exceed.
5. **Be specific**: "fix: handle null user in profile screen" is good. "fix: bug fix" is not.

### Bad vs Good Subject Lines

```
# bad — past tense
fix(auth): fixed null pointer in login

# bad — period at end
feat: add dark mode support.

# bad — vague
chore: update stuff

# bad — exceeds {{max_subject_length}} chars (if subject is too long)
feat(dashboard): add a comprehensive analytics panel with all the new KPI widgets and export button

# good
fix(auth): handle null user in profile screen
feat: add dark mode toggle to settings
chore(deps): bump react-query to 5.28
```

---

## Scope

The scope is an optional (or required, see below) noun describing the section of the codebase the commit touches.

Format: `type(scope): subject`

```
feat(auth): add biometric login
fix(cart): correct item count on remove
refactor(api): extract pagination helper
```

### When scope is required

**{{require_scope}}** — if `true`, every commit must include a scope. A commit without a scope will be rejected.

### Allowed scopes

If `{{scopes}}` is non-empty, only the listed scopes are permitted. Any other scope is invalid.

Allowed scopes for this project: `{{scopes}}`

When any scope is valid (scopes is empty), choose the scope that most precisely identifies the changed subsystem: a module name, a route group, a domain (auth, billing, notifications), or a major component.

---

## Breaking Changes

Two ways to mark a breaking change:

**Option 1 — exclamation mark after type:**
```
feat!: remove deprecated /v1 endpoints
fix(api)!: change response shape for /users
```

**Option 2 — `BREAKING CHANGE:` footer:**
```
feat: migrate to new auth provider

BREAKING CHANGE: The `authToken` cookie is no longer set.
Clients must migrate to the Authorization header.
```

Both approaches are valid and may be combined. Use the exclamation mark when the breaking nature is the most important thing to communicate. Use the footer when you need to explain migration steps.

---

## Body

Include a body when the subject line cannot convey the full context. The body:
- Explains **why** the change was made, not just what changed (the diff already shows what)
- Is separated from the subject by a **blank line**
- Wraps at 100 characters per line
- May use bullet points

```
refactor(db): replace raw SQL queries with query builder

Raw SQL strings were scattered across 14 service files with no
type safety. Switching to the query builder centralises query
logic, enables type-checked column references, and makes
pagination consistent across all list endpoints.
```

**Skip the body** when the subject is self-explanatory (most `chore`, `style`, `docs` commits).

---

## Footer

Footers come after the body (separated by a blank line) and follow `Token: value` format:

```
fix(payments): retry on 503 response

Closes #412
Reviewed-by: Jane Smith <jane@example.com>
BREAKING CHANGE: The retry delay is now exponential, not fixed.
```

Common footer tokens:
- `Closes #<n>` — closes a GitHub issue
- `BREAKING CHANGE: <description>` — documents breaking change
- `Co-authored-by: Name <email>` — credits co-authors

---

## PR Title

The pull request title **must** follow the same convention as a commit subject line:
- Same type list, same scope rules, same subject line rules
- Same {{max_subject_length}} character limit
- The PR title becomes the squash-merge commit message — it must be correct

```
# bad PR title
Update auth stuff

# good PR title
feat(auth): add OAuth2 login with Google and Apple
```

---

## Full Examples

### Minimal (no body, no footer)
```
chore(deps): bump eslint to 9.0
```

### Feature with scope and body
```
feat(notifications): add push notification preferences screen

Users previously had no way to configure which notification
categories they receive. This adds a dedicated preferences
screen accessible from the profile menu.
```

### Breaking fix with footer
```
fix(api)!: return 422 instead of 400 for validation errors

BREAKING CHANGE: All validation errors now return HTTP 422
Unprocessable Entity instead of 400 Bad Request. Clients
should update their error-handling logic accordingly.

Closes #789
```

### Refactor without body (self-explanatory)
```
refactor(hooks): extract useDebounce into shared utilities
```
