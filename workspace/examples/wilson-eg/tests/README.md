# API tests

Smoke tests for Flask JSON routes. Run from the **repository root**:

```bash
python -m pytest tests/ -v
```

Imports resolve **`project/backend/app.py`** via `sys.path` in `test_api_endpoints.py`.
