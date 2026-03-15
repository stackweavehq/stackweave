# Python Testing Rules

All tests use **pytest**. The `unittest` module is not used for new tests.

---

## Framework and Configuration

1. **pytest only**: no `unittest.TestCase` subclasses for new tests. Existing `unittest` tests may remain but must not be expanded.
2. **Test file naming**: use `test_<module>.py` (e.g., `test_auth.py`, `test_order_service.py`). Alternatively `<module>_test.py` is acceptable if the project already uses that convention consistently — do not mix both.
3. **Test function naming**: `test_<what>_<condition>` — `test_create_order_with_empty_items_raises`, `test_get_user_returns_none_when_not_found`.
4. **One assertion focus per test**: each test should verify one specific behaviour. Split tests that have unrelated assertions.

---

## Fixtures

5. **Use fixtures over setUp/tearDown**: `conftest.py` fixtures shared across a test module or package are preferred over per-class setup.
6. **Fixture scope**: use `scope="session"` for expensive setup (database connection pool, test server), `scope="function"` (default) for anything that mutates state.

```python
# conftest.py
import pytest
from myapp.db import create_engine, Session

@pytest.fixture(scope="session")
def engine():
    return create_engine("sqlite:///:memory:")

@pytest.fixture
def db_session(engine):
    with Session(engine) as session:
        yield session
        session.rollback()
```

---

## Async Tests

7. **Use `pytest-asyncio`** for all async test functions. Do not use `asyncio.run()` inside tests.
8. Configure the asyncio mode in `pyproject.toml`:
   ```toml
   [tool.pytest.ini_options]
   asyncio_mode = "auto"
   ```
9. Mark async tests or use the auto mode — do not mix auto and manual marking in the same project.

```python
# good — with asyncio_mode = "auto"
async def test_fetch_user_returns_correct_data(http_client):
    response = await http_client.get("/users/123")
    assert response.status_code == 200
    assert response.json()["id"] == "123"
```

---

## Mocking

10. **Mock external services, not internals**: mock at the boundary — HTTP calls, database queries, filesystem access. Do not mock internal application logic; test it directly.
11. **Use `unittest.mock.patch` or `pytest-mock`**: prefer `pytest-mock`'s `mocker` fixture for cleaner setup/teardown.

```python
def test_send_welcome_email_calls_smtp(mocker):
    mock_send = mocker.patch("myapp.email.smtp_client.send")
    send_welcome_email("user@example.com")
    mock_send.assert_called_once_with(
        to="user@example.com",
        subject="Welcome!",
    )
```

12. **Avoid over-mocking**: if you mock every collaborator, you're testing mocks, not code. Mock at the I/O boundary and let the application logic run.

---

## Parametrize

13. **Use `@pytest.mark.parametrize`** for tests that differ only in inputs and expected outputs — do not write `for` loops inside test functions.

```python
import pytest

@pytest.mark.parametrize("discount,expected_total", [
    (0.0, 100.0),
    (0.1, 90.0),
    (0.5, 50.0),
    (1.0, 0.0),
])
def test_apply_discount(discount: float, expected_total: float) -> None:
    order = Order(subtotal=100.0)
    assert order.apply_discount(discount) == expected_total
```

14. **Parametrize with IDs**: use the `ids` parameter or `pytest.param` with an `id` argument when the test IDs are not self-descriptive from the values alone.

---

## Test Structure and Coverage

15. **Mirror `src/` layout**: `tests/` should mirror the structure of `src/` (or the top-level package). `test_auth.py` tests `src/auth.py`.
16. **No production code in tests**: tests must not import from each other. Shared test utilities go in `tests/conftest.py` or a `tests/helpers/` package.
17. **Test edge cases explicitly**: test `None` inputs, empty collections, boundary values, and error conditions — not just the happy path.
18. **Coverage target**: aim for >90% line coverage. Use `pytest-cov` and fail CI below the threshold:
    ```toml
    [tool.pytest.ini_options]
    addopts = "--cov=src --cov-fail-under=90"
    ```
