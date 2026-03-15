# Python Project Structure Guide

## src Layout vs Flat Layout

### src Layout (recommended for libraries and installable packages)

```
my-project/
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── service.py
│       │   └── models.py
│       ├── api/
│       │   ├── __init__.py
│       │   ├── routes.py
│       │   └── schemas.py
│       └── db/
│           ├── __init__.py
│           ├── client.py
│           └── migrations/
├── tests/
│   ├── conftest.py
│   ├── test_auth/
│   │   ├── test_service.py
│   │   └── test_models.py
│   └── test_api/
│       └── test_routes.py
├── pyproject.toml
├── .python-version
└── README.md
```

**Use the src layout when:**
- The package will be installed (`pip install .` or published to PyPI)
- You want to prevent accidental imports of the source tree instead of the installed package during testing
- Running `pytest` from the project root

### Flat Layout (acceptable for applications / scripts)

```
my-project/
├── mypackage/
│   ├── __init__.py
│   └── ...
├── tests/
│   └── ...
└── pyproject.toml
```

**Use the flat layout when:**
- It is an application (a service, CLI tool, or script) that is never installed as a library
- The team is small and the extra `src/` level adds friction without benefit

---

## pyproject.toml Configuration

A complete `pyproject.toml` for a project using ruff, pytest, and mypy:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mypackage"
version = "0.1.0"
description = "My application"
requires-python = ">=3.12"
dependencies = [
    "httpx>=0.27",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5.0",
    "ruff>=0.4",
    "mypy>=1.10",
]

[project.scripts]
myapp = "mypackage.cli:main"

# ── Ruff ──────────────────────────────────────────────────
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
    "S",   # flake8-bandit (security)
    "ANN", # flake8-annotations (type hints)
]
ignore = [
    "ANN101", # Missing type annotation for `self`
    "ANN102", # Missing type annotation for `cls`
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"] # Allow assert in tests

# ── pytest ─────────────────────────────────────────────────
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "--cov=src --cov-report=term-missing --cov-fail-under=90"

# ── mypy ───────────────────────────────────────────────────
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
```

---

## tests/ Structure

Mirror the `src/` package layout exactly. If you have `src/mypackage/auth/service.py`, the tests live in `tests/auth/test_service.py`.

```
tests/
├── conftest.py          # Shared fixtures (db session, http client, etc.)
├── auth/
│   ├── conftest.py      # Auth-specific fixtures
│   ├── test_service.py
│   └── test_models.py
├── api/
│   └── test_routes.py
└── db/
    └── test_client.py
```

---

## `__init__.py` Conventions

- **Include** `__init__.py` in every package directory — this makes the directory an importable Python package.
- **Keep `__init__.py` minimal**: import only what should be part of the public API. Deep internals stay un-exported.
- **Do not** put business logic in `__init__.py`. Use it only for re-exports.

```python
# src/mypackage/auth/__init__.py
# Re-export the public interface; callers use `from mypackage.auth import AuthService`
from mypackage.auth.service import AuthService
from mypackage.auth.models import User, Session

__all__ = ["AuthService", "User", "Session"]
```

---

## Entry Points

Define console scripts in `pyproject.toml` rather than standalone scripts:

```toml
[project.scripts]
myapp = "mypackage.cli:main"
myapp-worker = "mypackage.worker:main"
```

The `main()` function should be minimal — parse args, set up logging, then call into the application layer.

```python
# src/mypackage/cli.py
import argparse
import logging

from mypackage.app import run

def main() -> None:
    parser = argparse.ArgumentParser(description="myapp CLI")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)
    run()
```

---

## Managing the Project with {{package_manager}}

```bash
# Create a new project
uv init myproject && cd myproject

# Add a dependency
uv add httpx

# Add a dev dependency
uv add --dev pytest ruff

# Run a command in the virtual environment
uv run pytest

# Sync dependencies from lockfile
uv sync
```

The `.python-version` file pins the interpreter:
```
3.12
```

Commit `.python-version` and the lockfile (`uv.lock` or `poetry.lock`) to the repository.
