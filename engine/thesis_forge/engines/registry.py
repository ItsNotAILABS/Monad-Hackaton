"""Cloud engine registry — catalog + invoke."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Type

from .base import CloudEngine
from .chain_engine import ChainEngine
from .doc_engine import DocEngine
from .gas_engine import GasEngine
from .index_engine import IndexEngine
from .law_engine import LawEngine
from .research_engine import ResearchEngine
from .security_engine import SecurityEngine

_ENGINES: Dict[str, CloudEngine] = {}


def _register(cls: Type[CloudEngine]) -> None:
    inst = cls()
    _ENGINES[inst.id] = inst


def _ensure() -> None:
    if _ENGINES:
        return
    for cls in (
        ChainEngine,
        GasEngine,
        LawEngine,
        ResearchEngine,
        IndexEngine,
        DocEngine,
        SecurityEngine,
    ):
        _register(cls)


def list_engines() -> List[Dict[str, Any]]:
    _ensure()
    return [e.meta() for e in _ENGINES.values()]


def get_engine(engine_id: str) -> Optional[CloudEngine]:
    _ensure()
    return _ENGINES.get(engine_id)


def run_engine(engine_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    eng = get_engine(engine_id)
    if not eng:
        return {"ok": False, "error": f"unknown engine {engine_id}", "engines": [e["id"] for e in list_engines()]}
    return eng.invoke(params)


def engine_catalog(network: str = "monad-testnet") -> Dict[str, Any]:
    _ensure()
    return {
        "schema": "thesis.cloud.engines.v1",
        "product": "THESIS Cloud Engines",
        "locality": "cloud",
        "hosted_web_app": True,
        "chain": "monad",
        "network_default": network,
        "doctrine": (
            "Engines run on the API host serving this web app. "
            "They call Monad RPC and platform modules. "
            "Browser-local AI is separate (LOCAL AI tab)."
        ),
        "count": len(_ENGINES),
        "engines": list_engines(),
        "api": {
            "list": "GET /engines",
            "get": "GET /engines/{id}",
            "run": "POST /engines/{id}/run",
            "pipeline": "POST /engines/pipeline",
            "docs_download": "GET /engines/docs/download/{filename}",
        },
    }
