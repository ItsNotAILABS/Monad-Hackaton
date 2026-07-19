"""Persist forged projects under projects/ for IDE reload."""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

_ROOT = Path(__file__).resolve().parents[2]
_PROJECTS = _ROOT / "projects"


def _safe_id(project_id: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", project_id)[:80]


def projects_root() -> Path:
    _PROJECTS.mkdir(parents=True, exist_ok=True)
    return _PROJECTS


def save_project(
    project_id: str,
    *,
    manifest: dict,
    files: Dict[str, str],
    events: Optional[List[dict]] = None,
    arena: Optional[dict] = None,
    extra: Optional[dict] = None,
) -> dict:
    pid = _safe_id(project_id)
    root = projects_root() / pid
    root.mkdir(parents=True, exist_ok=True)
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    src_root = root / "package"
    for rel, content in files.items():
        path = src_root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    meta = {
        "project_id": pid,
        "saved_at": time.time(),
        "n_files": len(files),
        "manifest_hash": manifest.get("manifest_hash"),
        "network": manifest.get("network"),
        "chain_id": manifest.get("chain_id"),
        "paths": sorted(files.keys()),
    }
    if events is not None:
        (root / "events.json").write_text(json.dumps(events, indent=2), encoding="utf-8")
        meta["n_events"] = len(events)
    if arena is not None:
        (root / "arena.json").write_text(json.dumps(arena, indent=2), encoding="utf-8")
    if extra:
        (root / "extra.json").write_text(json.dumps(extra, indent=2), encoding="utf-8")
    (root / "project.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return {"ok": True, "path": str(root), **meta}


def list_projects() -> List[dict]:
    root = projects_root()
    out = []
    for d in sorted(root.iterdir() if root.exists() else [], key=lambda p: p.stat().st_mtime, reverse=True):
        if not d.is_dir():
            continue
        meta_path = d / "project.json"
        if meta_path.exists():
            try:
                out.append(json.loads(meta_path.read_text(encoding="utf-8")))
                continue
            except Exception:
                pass
        out.append({"project_id": d.name, "path": str(d)})
    return out


def load_project(project_id: str) -> Optional[dict]:
    pid = _safe_id(project_id)
    root = projects_root() / pid
    if not root.exists():
        return None
    result: Dict[str, Any] = {"project_id": pid, "path": str(root)}
    for name in ("project.json", "manifest.json", "events.json", "arena.json", "extra.json"):
        p = root / name
        if p.exists():
            try:
                result[name.replace(".json", "")] = json.loads(p.read_text(encoding="utf-8"))
            except Exception as exc:
                result[name] = {"error": str(exc)}
    pkg = root / "package"
    files = {}
    if pkg.exists():
        for f in pkg.rglob("*"):
            if f.is_file():
                rel = str(f.relative_to(pkg)).replace("\\", "/")
                try:
                    files[rel] = f.read_text(encoding="utf-8")
                except Exception:
                    files[rel] = ""
    result["files"] = files
    return result
