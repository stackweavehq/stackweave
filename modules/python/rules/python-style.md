# Python Style Rules

Python version: **{{python_version}}**
Formatter/linter: **{{formatter}}**
Package manager: **{{package_manager}}**
Type hints enforced: **{{use_type_hints}}**

---

## PEP 8 Compliance

1. **Line length**: 88 characters maximum (compatible with ruff and black defaults).
2. **Indentation**: 4 spaces — no tabs, ever.
3. **Blank lines**: 2 blank lines between top-level definitions (functions, classes); 1 blank line between methods inside a class.
4. **Trailing whitespace**: never permitted — configure your editor to strip it on save.

---

## Naming Conventions

5. **Variables and functions**: `snake_case` — `user_id`, `get_active_users`, `parse_response`.
6. **Classes**: `PascalCase` — `UserProfile`, `ApiClient`, `DatabaseError`.
7. **Constants**: `UPPER_SNAKE_CASE` — `MAX_RETRIES`, `DEFAULT_TIMEOUT`, `BASE_URL`.
8. **Private members**: prefix with a single underscore — `_internal_cache`, `_validate_input`. Double underscores only for name-mangling (rare).
9. **Module names**: `snake_case`, short, no hyphens — `auth_utils.py`, `db_client.py`.
10. **Type aliases**: `PascalCase` — `UserId = str`, `ResponseData = dict[str, Any]`.

---

## Type Hints

When `{{use_type_hints}}` is `true`, all functions and methods **must** have type annotations:
- All parameters must be annotated
- Return types must be annotated (including `-> None` for functions with no return value)
- Class attributes defined in `__init__` must be annotated

```python
# bad — no type hints
def get_user(user_id):
    return db.fetch(user_id)

# good
def get_user(user_id: str) -> User | None:
    return db.fetch(user_id)
```

11. **Forward references**: use `from __future__ import annotations` at the top of any file where a type references a class defined later in the same file.
12. **Generic types**: use the built-in generic syntax (Python 3.9+): `list[str]`, `dict[str, int]`, `tuple[int, ...]` — do not import `List`, `Dict`, `Tuple` from `typing`.
13. **Optional**: prefer `T | None` over `Optional[T]` (Python 3.10+ union syntax). Use `from __future__ import annotations` on {{python_version}} to enable this syntax file-wide.
14. **Any**: avoid `Any` — it defeats type checking. Use `object` or `Unknown` (mypy) when the type is genuinely unknown; narrow with `isinstance` checks.

---

## Docstrings (PEP 257)

15. Every public module, class, and function must have a docstring.
16. One-liner for simple functions: `"""Return the user's display name."""` — period, fits on one line.
17. Multi-line format with summary, blank line, then sections:

```python
def create_order(user_id: str, items: list[OrderItem], discount: float = 0.0) -> Order:
    """Create and persist a new order for the given user.

    Args:
        user_id: The UUID of the user placing the order.
        items: Non-empty list of items to include in the order.
        discount: Fractional discount to apply (0.0–1.0). Defaults to 0.0.

    Returns:
        The newly created Order with a generated order_id.

    Raises:
        ValueError: If items is empty or discount is outside [0.0, 1.0].
        DatabaseError: If the order cannot be persisted.
    """
```

---

## Imports

18. **Import ordering**: stdlib → third-party → local, each group separated by a single blank line. Use `isort` or `ruff` to enforce this automatically.
19. **No wildcard imports**: `from module import *` is forbidden. Explicit imports only.
20. **Absolute imports** preferred over relative imports for clarity in larger packages.

```python
# correct import order
import os
import sys
from pathlib import Path

import httpx
import pydantic

from myapp.auth import verify_token
from myapp.models import User
```

---

## Filesystem Operations

21. **Use `pathlib.Path`** for all filesystem operations — never `os.path`. `Path` objects are more readable and composable.

```python
# bad
import os
config_path = os.path.join(os.getcwd(), 'config', 'settings.json')

# good
from pathlib import Path
config_path = Path.cwd() / 'config' / 'settings.json'
```

---

## String Formatting

22. **f-strings** are the only acceptable interpolation method for runtime strings. Do not use `%` formatting or `.format()` for new code.

```python
# bad
message = "Hello, %s. You have %d messages." % (name, count)
message = "Hello, {}. You have {} messages.".format(name, count)

# good
message = f"Hello, {name}. You have {count} messages."
```

---

## Structured Data

23. **Use `dataclasses` or `pydantic` for structured data** — not plain dicts. Plain dicts have no type safety, no field documentation, and no validation.

```python
# bad
def get_user() -> dict:
    return {"id": "abc", "name": "Jane"}

# good — dataclass for internal data
from dataclasses import dataclass

@dataclass
class User:
    id: str
    name: str

# good — pydantic for API boundaries (validates on construction)
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    name: str
```

---

## Exception Handling

24. **Catch specific exceptions**: never use bare `except:` or `except Exception:` unless you immediately re-raise.
25. **Exception chaining**: always use `raise NewError(...) from original_error` to preserve the traceback chain.
26. **No silent swallowing**: do not `except SomeError: pass` — log or re-raise.

```python
# bad
try:
    result = api.call()
except:
    result = None

# bad — loses original traceback
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    raise ValueError("Invalid JSON")

# good
try:
    data = json.loads(raw)
except json.JSONDecodeError as exc:
    raise ValueError(f"Invalid JSON in response: {exc}") from exc
```

---

## Async / Await

27. **Do not mix sync and async** code in the same call chain. An async function must only be called with `await`; a sync function must not call `asyncio.run()` internally.
28. **Concurrent operations**: use `asyncio.gather()` for running multiple coroutines concurrently. Do not `await` them sequentially when they are independent.

```python
# bad — sequential when they could be concurrent
user = await get_user(user_id)
permissions = await get_permissions(user_id)

# good
user, permissions = await asyncio.gather(
    get_user(user_id),
    get_permissions(user_id),
)
```

29. **Async context managers and iterators**: use `async with` for async resources (database connections, HTTP sessions); use `async for` for async iterables.

---

## Virtual Environments and Tooling

30. **Always use a virtual environment** — never install packages globally into the system Python.
31. **Use {{package_manager}}** as the package manager for this project. Do not mix multiple package managers (e.g., do not run `pip install` in a `uv`-managed project).
32. **`.python-version` file**: commit this file to the repo root so that pyenv and `uv` can pin the runtime to `{{python_version}}`.
33. **Run {{formatter}}** before every commit. Configure pre-commit or CI to block unformatted code.
