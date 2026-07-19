"""Single-origin production entrypoint for MonadBuilder HQ.

This module keeps every existing FastAPI route and, when ``web/dist`` exists,
serves the compiled React application from the same process and origin.
That makes custom-domain and Replit deployments deterministic: browser calls
``/health`` and every other API route without localhost or CORS assumptions.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api import app

_ROOT = Path(__file__).resolve().parents[2]
_WEB_DIST = _ROOT / "web" / "dist"
_INDEX = _WEB_DIST / "index.html"
_ASSETS = _WEB_DIST / "assets"


@app.get("/runtime/health", include_in_schema=False)
def runtime_health() -> dict[str, object]:
    """Deployment-level readiness, separate from product health."""

    return {
        "ok": True,
        "mode": "single-origin",
        "api": True,
        "frontend": _INDEX.is_file(),
        "web_dist": str(_WEB_DIST),
    }


if _ASSETS.is_dir():
    app.mount("/assets", StaticFiles(directory=_ASSETS), name="web-assets")


if _INDEX.is_file():

    @app.get("/", include_in_schema=False)
    def web_index() -> FileResponse:
        return FileResponse(_INDEX)


    @app.get("/{full_path:path}", include_in_schema=False)
    def web_spa(request: Request, full_path: str):
        """Serve real files or the SPA shell; never mask failed JSON API calls."""

        requested = (_WEB_DIST / full_path).resolve()
        try:
            requested.relative_to(_WEB_DIST.resolve())
        except ValueError as exc:
            raise HTTPException(404, "not found") from exc

        if requested.is_file():
            return FileResponse(requested)

        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            return FileResponse(_INDEX)

        raise HTTPException(404, "not found")
