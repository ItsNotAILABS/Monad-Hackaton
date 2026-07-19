"""Security engine — server-side scan (no secret storage)."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from ..receipts import seal
from .base import CloudEngine

SECRET_PATTERNS = [
    ("privkey-hex", re.compile(r"\b(?:0x)?[a-fA-F0-9]{64}\b"), "critical", "Possible private key"),
    ("mnemonic", re.compile(r"\b([a-z]+\s+){11,23}[a-z]+\b", re.I), "critical", "Possible seed phrase"),
    ("api-key", re.compile(r"\b(?:sk|api[_-]?key|secret)[-_:= ]+[A-Za-z0-9/+=]{16,}", re.I), "high", "API key-like"),
]

RISK_PATTERNS = [
    ("unlimited", re.compile(r"unlimited\s+approv|maxUint256", re.I), "high", "Unlimited approval"),
    ("silent", re.compile(r"auto[- ]?broadcast|without\s+signature", re.I), "critical", "Silent broadcast"),
    ("export-key", re.compile(r"export\s+(private\s+)?key|show\s+mnemonic", re.I), "critical", "Key export"),
    ("fat-gas", re.compile(r"2x\s+buffer|gas\s*limit\s*[:=]?\s*\d{7,}", re.I), "medium", "Fat gas limit"),
    ("blob", re.compile(r"EIP-?4844|blob\s+tx|type\s*3\b", re.I), "medium", "Blob tx unsupported"),
]


class SecurityEngine(CloudEngine):
    id = "security"
    name = "Security Engine"
    kind = "security"
    description = "Cloud scan for secrets + DeFi risk language; never stores secret material"
    requires_chain = False

    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        p = params or {}
        text = str(p.get("text") or p.get("content") or "")
        findings: List[Dict[str, Any]] = []
        for fid, rx, sev, label in SECRET_PATTERNS + RISK_PATTERNS:
            m = rx.findall(text)
            # findall may return tuples for groups
            n = len(m) if m else 0
            if n:
                findings.append(
                    {
                        "id": fid,
                        "severity": sev,
                        "label": label,
                        "count": n,
                        # never echo full match for critical secrets
                        "sample": "[redacted]" if sev == "critical" else label,
                    }
                )
        score = sum(
            40 if f["severity"] == "critical" else 20 if f["severity"] == "high" else 8
            for f in findings
        )
        ok = not any(f["severity"] in ("critical", "high") for f in findings)
        seal(
            "cloud.security.scan",
            {
                "findings": len(findings),
                "score": min(100, score),
                "ok": ok,
                "bytes_scanned": len(text),
            },
        )
        return {
            "ok": True,
            "clean": ok,
            "score": min(100, score),
            "findings": findings,
            "bytes_scanned": len(text),
            "doctrine": "Never paste real keys/seeds into cloud engines.",
            "locality": "cloud",
        }
