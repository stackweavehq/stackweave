## Python Stack

This project is written in **Python {{python_version}}**.

### Toolchain

| Tool | Role |
|------|------|
| **{{package_manager}}** | Package and virtual environment management |
| **{{formatter}}** | Code formatting and linting |
| **pytest** | Test runner |
| **mypy** | Static type checking |

### Key Conventions

- **Type hints**: {{use_type_hints}} — all function parameters and return types must be annotated when enabled.
- **Line length**: 88 characters (ruff/black default).
- **Import order**: stdlib → third-party → local, enforced by `{{formatter}}`.
- **Structured data**: use `dataclasses` or `pydantic` — not plain dicts.
- **Filesystem**: `pathlib.Path` everywhere, never `os.path`.
- **Strings**: f-strings only — no `%` or `.format()`.
- **Exceptions**: catch specific exceptions, always chain with `raise X from e`.

### Project Layout

```
src/<package>/    # Application source (src layout)
tests/            # Mirrors src/ structure
pyproject.toml    # All tool configuration (ruff, pytest, mypy)
.python-version   # Pins Python {{python_version}} for pyenv/uv
```

### Running the Toolchain

```bash
# Format and lint
{{formatter}} format . && {{formatter}} check .

# Type check
mypy src/

# Test
{{package_manager}} run pytest
```
