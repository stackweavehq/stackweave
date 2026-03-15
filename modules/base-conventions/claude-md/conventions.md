## Development Conventions

### Git Workflow

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.
Every commit message must have a type prefix (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, etc.)
and a concise imperative description in the subject line.

Branch names are prefixed by intent: `feature/`, `bugfix/`, `hotfix/`, `chore/`, `docs/`.

### Code Review

- All changes go through a pull request — no direct pushes to `main`.
- At least one approval is required before merging.
- Prefer **Squash and merge** to maintain a clean, linear history.
- PRs should be small and focused; avoid mixing unrelated changes.

### Commit Discipline

- Keep commits atomic: one logical change per commit.
- Do not commit commented-out code, debug logs, or temporary hacks.
- If work-in-progress commits are needed, use `git commit --fixup` and clean up with `git rebase --autosquash` before pushing.
