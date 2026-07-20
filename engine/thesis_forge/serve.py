"""Production entrypoint for the THESIS FastAPI backend.

The Node/Replit application proxies public ``/engine/*`` requests to this process.
The same app also accepts an ``/engine`` prefix directly for local and alternate
single-origin deployments.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import app
from .wallet_api import router as wallet_router

app.include_router(wallet_router)


@app.middleware("http")
async def engine_prefix_gateway(request: Request, call_next):
    path = request.scope.get("path", "")
    if path == "/engine" or path == "/engine/":
        request.scope["path"] = "/health"
        request.scope["raw_path"] = b"/health"
    elif path.startswith("/engine/"):
        mapped = path[len("/engine"):]
        request.scope["path"] = mapped
        request.scope["raw_path"] = mapped.encode()
    response = await call_next(request)
    if path.startswith("/engine"):
        response.headers["X-THESIS-Engine"] = "online"
    return response


@app.get("/runtime/health", include_in_schema=False)
def runtime_health():
    return {
        "ok": True,
        "runtime": "THESIS",
        "gateway": "/engine/*",
        "wallet_identity": "v1",
        "cli": ["thesis", "monadbuilder"],
    }


_ROOT = Path(__file__).resolve().parents[2]
_WEB_DIST = _ROOT / "web" / "dist"
if _WEB_DIST.exists():
    assets = _WEB_DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        candidate = (_WEB_DIST / path).resolve()
        if candidate.is_file() and _WEB_DIST.resolve() in candidate.parents:
            return FileResponse(candidate)
        index = _WEB_DIST / "index.html"
        return FileResponse(index) if index.exists() else JSONResponse({"detail": "not found"}, status_code=404)
