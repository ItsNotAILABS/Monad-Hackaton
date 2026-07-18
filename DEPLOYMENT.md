# Deployment

## Contracts

1. Install Foundry.
2. Export `MONAD_TESTNET_RPC_URL` and `PRIVATE_KEY`.
3. Fund the deployer with testnet MON.
4. Run `./scripts/deploy.sh`.
5. Record every resulting address in `receipts/deployment.json`.
6. Verify each contract using the current Monad Foundry verification guide.

## API

Deploy `engine/` to any Python 3.11+ host. Start with:

```bash
uvicorn thesis_forge.api:app --host 0.0.0.0 --port ${PORT:-8043}
```

## Web

Set `VITE_API_URL`, run `npm run build`, and deploy `web/dist` to a static host.

## Required hackathon evidence

- Hosted web URL
- Public GitHub repository
- Monad contract addresses
- Explorer/verification links
- Sub-3-minute public demo URL
- Social post URL
