# Replit Retirement Record

**Effective date:** July 20, 2026  
**System:** MonadBuilder+ · THESIS  
**Decision:** Replit is retired from production and development operations.

## What is preserved

GitHub preserves the implementation created during the Replit phase, including:

- the React/Vite MonadBuilder+ application;
- the Express API and PostgreSQL schema;
- generated-wallet onboarding;
- GitHub OAuth;
- templates, Gallery, Learn, and AI Studio;
- the THESIS FastAPI engine and governance runtime;
- Cloudflare edge-agent code;
- startup, integration, and submission history;
- contracts, reports, receipts, and deployment tooling.

Retirement does not discard this work. It changes which systems are authoritative.

## What is retired

The following are no longer supported production mechanisms:

- Replit Publish and autoscale deployment;
- `.replit` deployment configuration;
- Replit Secrets as the canonical secret store;
- Replit-specific Vite plugins as required runtime behavior;
- Replit artifact routing as the service topology;
- the Replit agent as an operator or source of truth;
- `scripts/replit_start.sh` as the documented production command;
- Replit-hosted database or scheduled-job assumptions.

## New authority

- **Source and history:** GitHub
- **Public delivery and edge execution:** Cloudflare
- **Chain connectivity:** Monad plus configured Ethereum L1 Web3 gateway
- **Continuous validation:** GitHub Actions and Cloudflare Cron synthetic users
- **Research and release evidence:** GitHub releases, repository manifests, R2 or other governed publication storage

## Handoff rule

All useful behavior created during the Replit phase must be absorbed into one of four destinations:

1. Cloudflare-native runtime;
2. GitHub CI or release automation;
3. governed extended runtime behind Cloudflare;
4. historical documentation marked `retired`.

No behavior should remain dependent on an inaccessible Replit workspace.

## Completion criteria

The retirement is operationally complete when:

- the Cloudflare-hosted application and APIs pass synthetic-user validation;
- OAuth, database, AI, wallet, chain, and receipt paths no longer require Replit;
- all production secrets are present outside Replit;
- local development works from a clean Git clone;
- the README and operator documentation contain no supported Replit instructions;
- remaining Replit packages are either removed or documented as unused historical dependencies;
- DNS and rollback records are verified.

## Known migration debt

At the time of this record, the repository still contains Replit-era dependencies and documentation that require systematic removal. Their presence does not make Replit an active production dependency, but they remain cleanup work until builds and lockfiles are regenerated and validated.

## Operator statement

The Replit agent is considered finished. Its outputs have been inherited through GitHub. Future changes are governed by repository evidence, Cloudflare deployment receipts, synthetic-user results, and explicit release records.