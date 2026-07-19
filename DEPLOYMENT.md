# Deployment (Monad official path)

Aligned with:

- [Deploy a Contract](https://docs.monad.xyz/guides/deploy-smart-contract/index)
- [Foundry on Monad](https://docs.monad.xyz/guides/deploy-smart-contract/foundry)
- [Verify with Foundry](https://docs.monad.xyz/guides/verify-smart-contract/foundry)
- [Network information](https://docs.monad.xyz/developer-essentials/network-information)
- [Deployment summary](https://docs.monad.xyz/developer-essentials/summary)

## Networks

| | Testnet (Spark default) | Mainnet |
|--|-------------------------|---------|
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | [testnet.monadvision.com](https://testnet.monadvision.com) | [monadvision.com](https://monadvision.com) |
| Faucet | [testnet.monad.xyz](https://testnet.monad.xyz) | — |
| Currency | MON | MON |

## Prerequisites

**Windows:** Foundry needs **WSL** ([docs note](https://docs.monad.xyz/guides/deploy-smart-contract/foundry)).

```bash
# Inside WSL
curl -L https://foundry.category.xyz | bash
foundryup --network monad
forge --version
```

Also: `forge-std` for scripts (install once in `contracts/`):

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
```

## 1. Fund deployer

1. Create or import a wallet (prefer **keystore**, not raw key in shell history).
2. Claim testnet MON: https://testnet.monad.xyz
3. Optional keystore (official recommendation):

```bash
cast wallet import monad-deployer --interactive
cast wallet address --account monad-deployer
```

## 2. Deploy THESIS kernel

From repo root (WSL), with funded key:

```bash
export PRIVATE_KEY=0x…          # or use FOUNDRY_ACCOUNT=monad-deployer
export DEPLOYER_OWNER=0x…       # vault owner (defaults to deployer if set in script via env)

# Testnet (Spark)
./scripts/deploy.sh testnet

# Mainnet (only if you intend Mainnet category)
# ./scripts/deploy.sh mainnet
```

What deploys (order):

1. `PolicyKernel`
2. `ReceiptChain`
3. `AgentRegistry`
4. `ProposalBook`
5. `ExecutionRouter`
6. **`SovereignVault(owner, policy, receipts)`** ← use this for Spark **Contract address**

Addresses are written to `receipts/deployment.json`.

Manual equivalent (docs style):

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast -vvv
```

## 3. Verify (MonadVision / Sourcify)

```bash
# Example after deploy
./scripts/verify.sh 10143 0xYourSovereignVault SovereignVault
./scripts/verify.sh 10143 0xYourPolicyKernel PolicyKernel
```

Or:

```bash
forge verify-contract \
  0xYourAddress \
  src/SovereignVault.sol:SovereignVault \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org/
```

Constructor-args contracts need the ABI-encoded constructor if the verifier asks for them (`SovereignVault`).

## 4. Spark submission fields

| Field | Value |
|-------|--------|
| Category | **Testnet** (unless you deployed mainnet) |
| Contract address | `SovereignVault` from `receipts/deployment.json` |
| Github | https://github.com/ItsNotAILABS/Monad-Hackaton |
| Project URL | Hosted web cockpit |
| Demo video | ≤3 min public URL |
| Post URL | Social post (viral prize) |

## API / Web (off-chain)

```bash
# Engine
cd engine && pip install -e ".[dev]"
uvicorn thesis_forge.api:app --host 0.0.0.0 --port 8043

# Web
cd web && npm install && npm run build
# set VITE_API_URL to API origin before build
```

## Safety

- No private keys in git or browser bundles.
- Prefer Foundry **keystore** over `PRIVATE_KEY` in shell history.
- Alpha is not audited — do not put real capital on test vaults without review.
