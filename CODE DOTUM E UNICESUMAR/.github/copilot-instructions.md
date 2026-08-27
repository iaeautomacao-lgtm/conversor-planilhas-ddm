# Copilot instructions for ETL-DDM

Quick, actionable guidance for AI coding agents working on this repo.

## Big picture
- This is a single-service FastAPI ETL that converts incoming CSVs into a normalized CSV for two institution formats: `UNICESUMAR` and `DOCTUM`.
- Core logic lives in `app/main.py`: mapping dictionaries (`MAP_UNICESUMAR`, `MAP_DOCTUM`) + `transform_*` functions that produce the output rows.
- Files are uploaded, processed in a temporary directory, and the converted CSV is returned directly (no database or long-running job queue).

## Run & dev commands
- Install deps: `pip install -r requirements.txt` (see `requirements.txt`).
- Local dev server: `uvicorn app.main:app --reload` (README and `app/render.yaml` show slightly different prod start args).

## HTTP surface
- Root health: `GET /`.
- Main conversion endpoint: `POST /etl/convert` with multipart `file` and query `institution=UNICESUMAR|DOCTUM`.
  - Only `.csv` uploads are accepted (extension check in `app/main.py`).
  - Returned file is a CSV with semicolon delimiters and `utf-8-sig` encoding.

## Data flow & formats
- Input: arbitrary CSVs (heuristic delimiter detection via `detectar_delimitador` and encoding detection via `chardet`).
- Mapping: keys in `MAP_UNICESUMAR`/`MAP_DOCTUM` -> transform functions (see `transform_unicesumar` / `transform_doctum`).
- Output: writer uses `delimiter=';'` and `OUTPUT_ENCODING = 'utf-8-sig'` so Excel is more likely to open it correctly.

## Project-specific conventions & patterns
- Add new institution support by adding a `MAP_*` mapping and a `transform_*` function, then wire a runner function and branch the `convert` endpoint.
- Use small pure helpers for formatting (e.g. `formatar_cpf`, `formatar_valor`, `formatar_data_*`) — prefer existing helpers to keep output consistent.
- Temporary files: uploads are saved into `tempfile.mkdtemp(...)` and cleaned via `BackgroundTasks` calling `shutil.rmtree`.

## Integration points / external deps
- Runtime: FastAPI + Uvicorn. See `app/render.yaml` for production start command.
- Dependencies listed in `requirements.txt`. Note: code imports `chardet` at runtime; if you add/modify encoding detection, ensure `chardet` is in `requirements.txt`.
- Storage folders used by developers: `storage/uploads/` and `storage/outputs/` (sample artifacts present in repo) — useful for manual replay and fixtures.

## Useful examples
- Run locally:

```
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Example curl (replace file and institution):

```
curl -F "file=@path/to/input.csv" "http://localhost:8000/etl/convert?institution=UNICESUMAR" -o output.csv
```

## Gotchas discovered in code
- README lists endpoints `/etl/upload`, `/etl/status`, `/etl/download` which are outdated — current endpoint is `/etl/convert` (see `app/main.py`).
- Ensure `chardet` is present in `requirements.txt` if you rely on `detectar_encoding`.

## Where to look when changing behaviour
- Entry point & all core logic: `app/main.py`.
- Deployment metadata: `app/render.yaml`.
- Dependencies: `requirements.txt`.
- Example input/output artifacts: `storage/uploads/`, `storage/outputs/`.

---
If any of these sections are unclear or you want more examples (unit tests, new institution template), tell me which part to expand.
