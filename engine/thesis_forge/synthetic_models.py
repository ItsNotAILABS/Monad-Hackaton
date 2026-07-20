"""Synthetic-user personas and executable use-case catalog.

The catalog is intentionally operational: every step names a real HTTP route,
expected response shape, mutability class, and execution cadence.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class SyntheticStep:
    id: str
    target: str
    method: str
    path: str
    assertions: tuple[str, ...] = ("http_2xx", "json", "nonempty", "latency")
    body: dict[str, Any] | None = None
    cadence: str = "smoke"
    mutability: str