"""Cloud engines — real server-side compute for the hosted web app.

These run on the API host (your cloud / VPS / Railway / etc.), talk to Monad
RPC, and are consumed by the browser UI. Browser-local AI remains separate.
"""

from .registry import engine_catalog, get_engine, list_engines, run_engine

__all__ = ["engine_catalog", "get_engine", "list_engines", "run_engine"]
