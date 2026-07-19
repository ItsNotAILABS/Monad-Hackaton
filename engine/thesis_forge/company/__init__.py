"""THESIS Company OS — miniature DeFi company for one wallet owner.

The user owns the company and the wallet.
THESIS is General Manager. Departments are Python engines under governance.
"""

from .os import (
    CompanyOS,
    act_on_mission,
    constitution_get,
    constitution_set,
    get_company,
    get_mission,
    headquarters,
    inbox,
    morning_brief,
    performance,
    run_objective,
)

__all__ = [
    "CompanyOS",
    "get_company",
    "run_objective",
    "morning_brief",
    "inbox",
    "get_mission",
    "act_on_mission",
    "performance",
    "constitution_get",
    "constitution_set",
    "headquarters",
]
