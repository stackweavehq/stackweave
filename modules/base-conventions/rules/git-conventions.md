# Git Conventions

## Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed types

| Type       | When to use                                      |
|------------|--------------------------------------------------|
| `feat`     | A new feature                                    |
| `fix`      | A bug fix                                        |
| `chore`    | Maintenance, dependency updates, tooling         |
| `docs`     | Documentation only changes                       |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                         |
| `perf`     | Performance improvement                          |
| `ci`       | CI/CD pipeline changes                           |
| `style`    | Formatting, missing semicolons (no logic change) |

### Examples

```
feat(auth): add biometric login support
fix(api): handle 429 rate-limit response correctly
chore(deps): bump typescript to 5.4
refactor(hooks): extract useAuth into separate module
```

## Branch Naming

Use the following prefixes:

- `feature/<short-description>` — new features
- `bugfix/<short-description>` — bug fixes
- `hotfix/<short-description>` — urgent production fixes
- `chore/<short-description>` — maintenance tasks
- `docs/<short-description>` — documentation updates

Use kebab-case. Keep names concise but descriptive.

```
feature/biometric-auth
bugfix/rate-limit-handling
hotfix/crash-on-login
```

## Pull Request Requirements

Every PR must include:

1. **Title**: follows the same Conventional Commits format as commit messages
2. **Description**: explains *why* the change is needed, not just *what* changed
3. **Testing notes**: describe how the change was tested (manual steps, automated tests, etc.)
4. **Linked issue** (if applicable): reference with `Closes #<issue-number>`

## Code Review Expectations

- Reviewers should respond within one business day
- Authors should not merge until at least one approval is received
- Resolve all blocking comments before merging
- Prefer `Squash and merge` to keep the commit history clean
