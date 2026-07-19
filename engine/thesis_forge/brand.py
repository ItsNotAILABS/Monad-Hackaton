"""Product brand — easy name for humans + AI delivery.

Name check (2026):
  - `MonadBuilder` exists as a *Rust type* in category-labs/monad-revm (EVM builder API)
  - "Monad Builder Residency" / "Monad Builder Club" are official ecosystem programs
  → Product brand: **MonadBuilder HQ** (clear product, not the residency / revm type)
  → Engine codename remains THESIS under the hood for continuity
"""

from __future__ import annotations

from . import __version__

# Public product name (Spark / judges / UI)
PRODUCT = "MonadBuilder HQ"
PRODUCT_SHORT = "MonadBuilder"
ENGINE = "THESIS"
TAGLINE = "AI delivers your Monad day — briefs, brakes, and wins you actually feel."
DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."
ONE_LINER = (
    "MonadBuilder HQ: daily AI briefs + addictive seatbelt loops + winner-class signals "
    "under dual-stack law — easy enough that the AI runs the morning for you."
)
NAME_NOTE = (
    "Not the official Monad Builder Residency/Club, and not monad-revm's MonadBuilder type. "
    "This is the DeFi Company OS workstation product."
)

SPARK = {
    "name": "Spark",
    "url": "https://buildanything.so/hackathons/spark",
    "prompt": "Build Anything onchain that solves a personal problem",
}


def brand_payload() -> dict:
    return {
        "schema": "monadbuilder.brand.v1",
        "product": PRODUCT,
        "product_short": PRODUCT_SHORT,
        "engine": ENGINE,
        "version": __version__,
        "tagline": TAGLINE,
        "one_liner": ONE_LINER,
        "doctrine": DOCTRINE,
        "name_note": NAME_NOTE,
        "spark": SPARK,
        "ai_delivered": True,
        "easy": True,
    }
