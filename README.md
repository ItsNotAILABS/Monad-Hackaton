# THESIS Forge

Monad-native intent-to-deployment foundry and sovereign DeFi operating layer.

THESIS Forge converts a builder objective into a governed application blueprint, Solidity contracts, Python engines, tests, deployment plans, verification commands, and release receipts. The flagship generated application is THESIS Sovereign DeFi: a policy-governed vault where agents propose actions but cannot bypass owner-defined laws.

## Hackathon provenance

This repository is a new build created for the Build Anything / Monad hackathon. No pre-hackathon application code is imported.

## Alpha capabilities

- Intent compiler: plain-language objective -> typed application manifest.
- Protocol atlas: adapter registry spanning swaps, lending, vaults, staking, perps, analytics, and agents.
- Policy kernel: asset, protocol, slippage, allocation, leverage, reserve, and agent limits.
- Agent arena: competing plans scored against policy and risk.
- Deployment forge: Foundry commands for Monad testnet/mainnet deployment and verification.
- Receipt chain: hash-linked build, simulation, policy, deployment, and execution receipts.
- Web cockpit: project generation, lawbook, protocol selection, plan comparison, and release view.

## Architecture

```text
Objective -> THESIS compiler -> Manifest -> CODEX generator -> TEST gates
          -> Deployment plan -> Monad contracts -> Verification -> NERVUS receipts

Wallet state -> SENSUS -> Agents -> MATHESIS -> NOMOS -> AGORA -> PRAXIS
             -> SovereignVault -> Monad -> receipt -> MEMORIA
```

## Run locally

```bash
cd engine
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn thesis_forge.api:app --reload --port 8043
```

```bash
cd web
npm install
npm run dev
```

```bash
cd contracts
forge test
```

## Monad networks

- Mainnet chain ID: `143`
- Testnet chain ID: `10143`

RPC URLs and private keys are supplied by environment variables. No secrets are committed.

## Status

Alpha source, Python validation, and production web build are complete. Live Monad deployment, contract verification, hosted URL, and public demo URL require operator credentials and external hosting.

## Repository

Public hackathon source: https://github.com/ItsNotAILABS/Monad-Hackaton
