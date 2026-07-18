"""Full platform reports — markdown + PDF downloads (no extra deps).

Used by the sovereign web terminal, AI node, and GET /reports/* APIs.
"""

from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from . import __version__
from .receipts import seal, tip

_ROOT = Path(__file__).resolve().parents[2]
_OUT = _ROOT / "receipts" / "reports"
_OUT.mkdir(parents=True, exist_ok=True)

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."


def _safe_name(s: str) -> str:
    return re.sub(r"[^\w.-]+", "_", (s or "thesis")[:48])


def assemble_full_report(network: str = "monad-testnet") -> Dict[str, Any]:
    """Gather dual-stack, vault, desk, company brief, tools, scorecard into one report."""
    from .company.os import headquarters, morning_brief
    from .competition import scorecard_live
    from .daily import home as daily_home
    from .ecosystem import ecosystem_bundle
    from .ecosystem_laws import embed_ecosystem_laws, runtime_status
    from .gas_intel import gas_coach
    from .lawbook import lawbook_payload
    from .trading import desk_snapshot
    from .vault_route import _load_vault_address
    from .wallets import registry_snapshot
    from .ai_node import node_status
    from .workspace import list_projects

    embed_ecosystem_laws()
    brief = morning_brief()
    laws = runtime_status()
    lb = lawbook_payload(network)
    desk = desk_snapshot()
    eco = ecosystem_bundle(network)
    gas = gas_coach()
    home = daily_home(network)
    wallets = registry_snapshot()
    ai = node_status()
    card = scorecard_live(network)
    hq = headquarters()
    vault = _load_vault_address()
    projects = list_projects()

    sections: List[Dict[str, str]] = [
        {
            "id": "doctrine",
            "heading": "Doctrine",
            "body": DOCTRINE + f"\nProduct THESIS Platform v{__version__}\nNetwork: {network}",
        },
        {
            "id": "daily_brief",
            "heading": "Daily brief (morning seatbelt)",
            "body": (
                f"{brief.get('narrative') or brief.get('headline') or 'Brief ready.'}\n"
                + "\n".join(f"• {b}" for b in (brief.get("bullets") or [])[:12])
            ),
        },
        {
            "id": "lawbook",
            "heading": "Dual law stack (LawBook + owner constitution)",
            "body": (
                f"Runtime laws: {laws.get('law_count')}\n"
                f"On-chain seed aligned: {(lb.get('alignment') or {}).get('seed_in_runtime')}/"
                f"{(lb.get('alignment') or {}).get('seed_total')}\n"
                f"Domains: {laws.get('domains')}\n"
                f"Veto: sys.nomos-veto · Reject is a feature."
            ),
        },
        {
            "id": "vault",
            "heading": "SovereignVault access",
            "body": (
                f"Deployed address: {vault or '(not recorded — run deploy or POST /deployment)'}\n"
                "Execution: policy-gated · simulation first · owner signature required.\n"
                "No silent broadcast (exec.no-silent-broadcast)."
            ),
        },
        {
            "id": "ecosystem",
            "heading": "Ecosystem catalog",
            "body": (
                f"Tokens: {len(eco.get('tokens') or [])}\n"
                f"Infra notes: {json.dumps((eco.get('infra') or {}) if isinstance(eco.get('infra'), dict) else eco.get('infra'), default=str)[:800]}\n"
                "Never invent addresses (monad.no-invent-addresses)."
            ),
        },
        {
            "id": "desk",
            "heading": "Trading desk",
            "body": (
                f"Equity: {desk.get('equity')} · Cash USDC: {desk.get('cash_usdc')}\n"
                f"Day PnL: {desk.get('day_pnl')} · Paper mode: {desk.get('paper_mode')}\n"
                "Arena: POST /desk/arena · REJECT is a feature."
            ),
        },
        {
            "id": "company",
            "heading": "Company OS / HQ",
            "body": (
                f"Pitch: {(hq.get('pitch') or {}).get('one_liner') or 'Company OS live'}\n"
                f"Inbox items: {len((hq.get('inbox') or {}).get('items') or hq.get('inbox') or [])}\n"
                "Workflow: SENSUS → AGORA → NOMOS → MATHESIS → PRAXIS → …"
            ),
        },
        {
            "id": "daily_loop",
            "heading": "Daily loop",
            "body": (
                f"Level {home.get('level')} · XP {home.get('xp')} · Streak {home.get('streak')}\n"
                f"Missions: {len(home.get('missions') or [])}"
            ),
        },
        {
            "id": "gas",
            "heading": "Monad gas coach",
            "body": (
                f"{(gas.get('tip') or {}).get('title')}: {(gas.get('tip') or {}).get('body')}\n"
                f"Demo limit: {(gas.get('demo_margin') or {}).get('recommended_gas_limit')} "
                f"(estimate {(gas.get('demo_margin') or {}).get('estimated_gas')})"
            ),
        },
        {
            "id": "ai",
            "heading": "Agent / AI node (sovereign)",
            "body": (
                f"Node: {ai.get('node_id')}\n"
                f"Real key access: {(ai.get('capabilities') or {}).get('real_key_access')}\n"
                f"Sandbox only: {(ai.get('capabilities') or {}).get('sandbox_only_mutations')}\n"
                "Agent can open terminal tools + request PDF reports — never keys."
            ),
        },
        {
            "id": "scorecard",
            "heading": "Competition scorecard",
            "body": (
                f"Grade {card.get('grade')} · {card.get('pct')}% "
                f"({card.get('passed')}/{card.get('total')})\n"
                + "\n".join(
                    f"{'✓' if c.get('pass') else '✗'} {c.get('label')}"
                    for c in (card.get("criteria") or [])[:16]
                )
            ),
        },
        {
            "id": "packages",
            "heading": "Forged packages",
            "body": f"{len(projects)} workspace projects under projects/",
        },
        {
            "id": "wallets",
            "heading": "Wallets (public only)",
            "body": (
                f"Linked: {len(wallets.get('links') or [])}\n"
                f"Stores private keys: {(wallets.get('security') or {}).get('stores_private_keys')}"
            ),
        },
    ]

    report = {
        "schema": "thesis.report.full.v1",
        "title": "THESIS Platform — Full Sovereign Ops Report",
        "version": __version__,
        "network": network,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "doctrine": DOCTRINE,
        "sections": sections,
        "vault_address": vault or None,
        "receipt_tip": tip()[:20] if tip() else None,
    }
    return report


def report_to_markdown(report: Dict[str, Any]) -> str:
    lines = [
        f"# {report.get('title')}",
        "",
        f"**Version:** {report.get('version')} · **Network:** {report.get('network')}",
        f"**Generated:** {report.get('generated_at')}",
        f"**Doctrine:** {report.get('doctrine')}",
        f"**Vault:** {report.get('vault_address') or 'not recorded'}",
        f"**Receipt tip:** {report.get('receipt_tip') or '—'}",
        "",
        "---",
        "",
    ]
    for s in report.get("sections") or []:
        lines.append(f"## {s.get('heading')}")
        lines.append("")
        lines.append(s.get("body") or "")
        lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("*Generated by THESIS Platform · Owner remains sovereign · REJECT is a feature.*")
    return "\n".join(lines)


def _escape_pdf_text(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\r", "")
    )


def markdown_to_simple_pdf(text: str, title: str = "THESIS Report") -> bytes:
    """Minimal multi-page PDF (Helvetica) — no third-party deps."""
    # Split into display lines
    raw_lines: List[str] = []
    for para in text.split("\n"):
        para = para.replace("\t", "  ")
        if len(para) <= 90:
            raw_lines.append(para if para else " ")
        else:
            words = para.split(" ")
            cur = ""
            for w in words:
                if len(cur) + len(w) + 1 > 90:
                    raw_lines.append(cur)
                    cur = w
                else:
                    cur = f"{cur} {w}".strip()
            if cur:
                raw_lines.append(cur)

    lines_per_page = 48
    pages: List[List[str]] = []
    for i in range(0, max(len(raw_lines), 1), lines_per_page):
        pages.append(raw_lines[i : i + lines_per_page])

    objects: List[bytes] = []
    # 1: catalog
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    # We'll fill pages later; reserve object numbers:
    # 2 = pages, 3 = font, then pairs of page+content

    font_obj_num = 3
    page_objs: List[int] = []
    content_objs: List[Tuple[int, bytes]] = []

    next_num = 4
    for page_lines in pages:
        page_num = next_num
        content_num = next_num + 1
        next_num += 2
        page_objs.append(page_num)

        # PDF content stream
        y = 800
        stream_lines = ["BT", "/F1 10 Tf", "14 TL", f"50 {y} Td"]
        first = True
        for line in page_lines:
            esc = _escape_pdf_text(line[:120])
            if first:
                stream_lines.append(f"({esc}) Tj")
                first = False
            else:
                stream_lines.append("T*")
                stream_lines.append(f"({esc}) Tj")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("latin-1", errors="replace")
        content_objs.append(
            (
                content_num,
                b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
            )
        )
        page_dict = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_num} 0 R /Resources << /Font << /F1 {font_obj_num} 0 R >> >> >>"
        ).encode()
        # store page at page_num — we'll build ordered list later
        content_objs.append((page_num, page_dict))

    # Font
    font_bytes = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    # Pages tree
    kids = " ".join(f"{n} 0 R" for n in page_objs)
    pages_bytes = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_objs)} >>".encode()

    # Assemble object map by number
    by_num: Dict[int, bytes] = {
        1: objects[0],
        2: pages_bytes,
        3: font_bytes,
    }
    for num, data in content_objs:
        by_num[num] = data

    max_n = max(by_num.keys())
    # Build PDF
    out = bytearray(b"%PDF-1.4\n")
    offsets = {0: 0}
    for i in range(1, max_n + 1):
        offsets[i] = len(out)
        body = by_num.get(i, b"<< >>")
        out.extend(f"{i} 0 obj\n".encode())
        out.extend(body)
        out.extend(b"\nendobj\n")

    xref_pos = len(out)
    out.extend(f"xref\n0 {max_n + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for i in range(1, max_n + 1):
        out.extend(f"{offsets[i]:010d} 00000 n \n".encode())
    out.extend(
        f"trailer\n<< /Size {max_n + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
    )
    return bytes(out)


def write_full_report(network: str = "monad-testnet", *, fmt: str = "both") -> Dict[str, Any]:
    """Write report files under receipts/reports and return paths + meta."""
    report = assemble_full_report(network)
    md = report_to_markdown(report)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    base = f"thesis-full-report-{_safe_name(network)}-{stamp}"
    md_path = _OUT / f"{base}.md"
    pdf_path = _OUT / f"{base}.pdf"
    md_path.write_text(md, encoding="utf-8")
    pdf_bytes = b""
    if fmt in ("pdf", "both"):
        pdf_bytes = markdown_to_simple_pdf(md, title=report.get("title") or "THESIS")
        pdf_path.write_bytes(pdf_bytes)

    receipt = seal(
        "report.full",
        {
            "network": network,
            "md": md_path.name,
            "pdf": pdf_path.name if fmt in ("pdf", "both") else None,
            "sections": len(report.get("sections") or []),
        },
    )
    return {
        "schema": "thesis.report.write.v1",
        "ok": True,
        "report": report,
        "markdown": md,
        "files": {
            "markdown": str(md_path.relative_to(_ROOT)).replace("\\", "/"),
            "pdf": str(pdf_path.relative_to(_ROOT)).replace("\\", "/")
            if fmt in ("pdf", "both")
            else None,
            "markdown_name": md_path.name,
            "pdf_name": pdf_path.name if fmt in ("pdf", "both") else None,
        },
        "download": {
            "markdown": f"/reports/download/{md_path.name}",
            "pdf": f"/reports/download/{pdf_path.name}" if fmt in ("pdf", "both") else None,
        },
        "receipt": receipt,
        "bytes_pdf": len(pdf_bytes),
    }


def list_reports(limit: int = 20) -> Dict[str, Any]:
    files = sorted(_OUT.glob("thesis-full-report-*"), key=lambda p: p.stat().st_mtime, reverse=True)
    items = []
    for p in files[:limit]:
        items.append(
            {
                "name": p.name,
                "path": str(p.relative_to(_ROOT)).replace("\\", "/"),
                "size": p.stat().st_size,
                "download": f"/reports/download/{p.name}",
                "kind": "pdf" if p.suffix == ".pdf" else "markdown",
            }
        )
    return {"schema": "thesis.reports.list.v1", "n": len(items), "reports": items, "dir": "receipts/reports"}


def resolve_report_file(filename: str) -> Optional[Path]:
    safe = Path(filename).name
    if ".." in safe or not safe.startswith("thesis-full-report-"):
        return None
    path = _OUT / safe
    if path.is_file():
        return path
    return None
