"""Engine contract — every cloud engine implements run()."""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class CloudEngine(ABC):
    id: str = "engine"
    name: str = "Engine"
    kind: str = "compute"
    description: str = ""
    requires_chain: bool = False
    locality: str = "cloud"  # runs on API host

    def meta(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "description": self.description,
            "requires_chain": self.requires_chain,
            "locality": self.locality,
            "hosted": True,
        }

    @abstractmethod
    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ...

    def invoke(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        t0 = time.time()
        params = params or {}
        try:
            result = self.run(params)
            ok = bool(result.get("ok", True))
            return {
                "ok": ok,
                "engine": self.id,
                "name": self.name,
                "locality": self.locality,
                "params": {k: v for k, v in params.items() if k not in ("private_key", "seed", "mnemonic")},
                "result": result,
                "elapsed_ms": (time.time() - t0) * 1000,
            }
        except Exception as exc:
            return {
                "ok": False,
                "engine": self.id,
                "name": self.name,
                "locality": self.locality,
                "error": str(exc)[:500],
                "elapsed_ms": (time.time() - t0) * 1000,
            }
