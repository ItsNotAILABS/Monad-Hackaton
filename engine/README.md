# THESIS engine

```bash
pip install -e ".[dev]"
uvicorn thesis_forge.api:app --reload --port 8043
pytest -q
```
