## Commit Conventions

This project uses the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages and PR titles.

### Format

```
<type>[(<scope>)]: <subject>
```

**Types**: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`, `build`, `style`

**Subject rules**: imperative mood, lowercase after colon, no trailing period, max **{{max_subject_length}} characters**.

**Scope required**: {{require_scope}} — when true, scope is mandatory on every commit; when false, scope is optional but recommended.
Allowed scopes: `{{scopes}}` (empty means any scope is valid).

### Breaking Changes

Mark with `!` after the type (`feat!:`) or with a `BREAKING CHANGE:` footer.

### When writing commit messages

- Use imperative mood: "add feature", not "added feature" or "adds feature"
- Keep the subject under {{max_subject_length}} characters — be concise and specific
- Add a body only when the subject cannot convey why the change was made
- PR titles must follow the same convention — they become the squash-merge commit message

### Examples

```
feat(auth): add OAuth2 login with Google
fix(api): return 422 for validation errors instead of 400
chore(deps): bump typescript to 5.5
refactor(db): extract query builder from service layer
docs: add API authentication guide
test(payments): add unit tests for retry logic
```
