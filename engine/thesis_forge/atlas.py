from .models import Category, Protocol

PROTOCOLS = [
    Protocol(id="uniswap", name="Uniswap", category=Category.DEX, capabilities=["quote", "swap", "liquidity"]),
    Protocol(id="pancake", name="PancakeSwap", category=Category.DEX, capabilities=["quote", "swap", "liquidity"]),
    Protocol(id="kuru", name="Kuru", category=Category.DEX, capabilities=["orderbook", "swap"]),
    Protocol(id="aave", name="Aave", category=Category.LENDING, capabilities=["supply", "borrow", "repay", "withdraw"]),
    Protocol(id="morpho", name="Morpho", category=Category.LENDING, capabilities=["supply", "borrow", "repay", "withdraw"]),
    Protocol(id="euler", name="Euler", category=Category.LENDING, capabilities=["supply", "borrow", "repay", "withdraw"]),
    Protocol(id="pendle", name="Pendle", category=Category.VAULT, capabilities=["yield-market", "deposit", "withdraw"]),
    Protocol(id="beefy", name="Beefy", category=Category.VAULT, capabilities=["deposit", "withdraw", "compound"]),
    Protocol(id="magma", name="Magma", category=Category.STAKING, capabilities=["stake", "unstake", "claim"]),
    Protocol(id="kintsu", name="Kintsu", category=Category.STAKING, capabilities=["stake", "unstake", "lst"]),
    Protocol(id="perpl", name="Perpl", category=Category.PERPS, capabilities=["open", "close", "hedge"]),
    Protocol(id="leverup", name="LeverUp", category=Category.PERPS, capabilities=["open", "close", "leverage"]),
    Protocol(id="birdeye", name="Birdeye", category=Category.ANALYTICS, capabilities=["prices", "markets"]),
    Protocol(id="monadvision", name="MonadVision", category=Category.ANALYTICS, capabilities=["positions", "transactions"]),
    Protocol(id="fere", name="FereAI", category=Category.AGENT, capabilities=["proposal", "analysis"]),
    Protocol(id="monad-agent-hub", name="Monad Agent Hub", category=Category.AGENT, capabilities=["identity", "discovery", "wallet"]),
]

def by_categories(categories: list[Category]) -> list[Protocol]:
    wanted = set(categories)
    return [p for p in PROTOCOLS if p.category in wanted]
