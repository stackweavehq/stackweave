# Suggest Commit Message

Review the staged changes and suggest a Conventional Commits-compliant commit message.

## Steps

1. Run `git diff --staged` to see all staged changes.
2. Run `git diff --staged --stat` to get a file-level summary.
3. Analyse the changes:
   - What is the primary intent? (new feature, bug fix, refactor, docs, etc.)
   - Which part of the codebase is affected? (auth, api, ui, deps, tests, etc.)
   - Is there any behaviour change visible to users or API consumers?
   - Are there any breaking changes?
4. Select the most appropriate type from: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`, `build`, `style`.
5. Determine a scope if the changes are clearly bounded to one subsystem or module.
6. Write a subject line in imperative mood, lowercase after the colon, no trailing period, max {{max_subject_length}} characters.
7. Determine whether a body is needed (needed when subject cannot convey full context).
8. Identify any breaking changes — add `!` after type or `BREAKING CHANGE:` footer.

## Output Format

Present the suggested commit message in a fenced code block:

```
<type>[(<scope>)]: <subject>

[optional body if needed]

[optional footers]
```

Then explain:
- **Why this type**: one sentence justifying the chosen type over alternatives.
- **Why this scope** (if used): what subsystem or module it targets.
- **Alternatives**: if the type or scope is ambiguous, list 1–2 alternatives with brief rationale.

## Example Output

Given `git diff --staged` showing changes to `src/auth/session.ts` that fix a crash when refresh token is missing:

```
fix(auth): handle missing refresh token in session restore
```

**Why `fix`**: This corrects a crash — existing behaviour was broken, now it works correctly.
**Why `auth` scope**: The change is confined to the authentication subsystem.
**Alternatives**: `fix(session)` if scopes are named by file/module rather than domain.

## Notes

- If the staged diff is empty, say so and prompt the user to stage changes first (`git add`).
- If the diff touches unrelated areas (e.g., a style fix alongside a feature), recommend splitting into separate commits.
- If `{{require_scope}}` is true, always include a scope — omitting it would be invalid.
- If `{{scopes}}` is non-empty, only suggest scopes from that list: `{{scopes}}`.
