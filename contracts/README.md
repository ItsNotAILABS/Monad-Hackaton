# THESIS Solidity (Monad)

Onchain law layer for the THESIS Platform — **agents propose, laws decide, receipts remember**.

## Layout

```
src/
  ThesisErrors.sol / ThesisTypes.sol
  libraries/   BpsMath, Hashing, GasHints   (Monad gas = limit)
  interfaces/  IPolicyKernel, IReceiptChain, ISovereignVault, IERC20Minimal
  PolicyKernel.sol       NOMOS / owner policy + allowlists + daily cap
  ReceiptChain.sol       NERVUS hash-linked receipts
  SovereignVault.sol     Spark submission — policy-gated execute
  AgentRegistry.sol      Agent identity / capabilities / expiry
  ProposalBook.sol       Proposal lifecycle + reject reasons
  ExecutionRouter.sol    Multi-call router into vault
  LawBook.sol            Ecosystem law registry (dual stack half; seedDefaultLaws)
  interfaces/ILawBook.sol
  TwinLedger.sol         Digital twin balances (no keys / no custody)
  CompanyRegistry.sol    Company OS mission commits
  GasPolicy.sol          ~7.5% margin coach params
  ThesisMulticall.sol    Batched reads
  ExactAllowance.sol     proto.exact-approval helper
  ThesisFactory.sol      Deploy full stack in one tx
script/Deploy.s.sol
test/*.t.sol
```

## Primary submission

**SovereignVault** — `PRIMARY_SUBMISSION_ADDRESS` after deploy.

## Monad notes

- Users pay **gas_limit**, not gas used → `GasHints` / `executeWithGas` / `GasPolicy`
- Native transfer gas **21_000** hardcoded helper
- Prefer Multicall3 at `0xcA11bde05977b3631167028862bE2a173976CA11` for production reads; `ThesisMulticall` is local helper

## Build / test (Foundry)

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit   # once
forge build
forge test -vv
```

Deploy (testnet):

```bash
export PRIVATE_KEY=0x...
forge script script/Deploy.s.sol:Deploy --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

## Security

Not audited. Testnet / alpha. Owner emergency paths exist. Unlimited ERC-20 approvals are rejected by `ExactAllowance` and discouraged by policy flags.
