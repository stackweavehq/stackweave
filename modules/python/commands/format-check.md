# Format and Lint Check

Run {{formatter}} format check and lint check on the codebase, then suggest fixes for any violations.

## Steps

1. Run the format check to see files that are not correctly formatted:

```bash
# Check formatting without modifying files
{{formatter}} format --check .
```

2. Run the linter to catch style and correctness issues:

```bash
# Lint check
{{formatter}} check .
```

3. If there are violations, offer to auto-fix:

```bash
# Fix formatting in place
{{formatter}} format .

# Fix lint issues that can be auto-fixed
{{formatter}} check --fix .
```

4. Run again to confirm the remaining violations (some rules require manual intervention).

5. Report any remaining violations that require manual action, grouped by rule code, with an explanation of each rule and how to fix it.

## For ruff specifically

```bash
# Check format + lint in one step, show diff for format issues
ruff format --check --diff .
ruff check .

# Auto-fix what can be fixed
ruff format .
ruff check --fix .

# See what a specific rule means
ruff rule <RULE_CODE>
```

## For black specifically

```bash
# Check without modifying
black --check --diff .

# Apply formatting
black .
```

## Notes

- Run this before committing. Pre-commit hooks should enforce this, but running manually first saves time.
- If you see `E501` (line too long), the project line limit is 88 characters — break the line or shorten identifiers.
- If you see `F401` (unused import), remove the import — do not suppress with `# noqa` unless there is a documented reason.
- Suppression comments (`# noqa: RULE`) are a last resort. Always explain why in the same comment: `# noqa: S603 — subprocess is called with a hard-coded list, no shell injection risk`.
