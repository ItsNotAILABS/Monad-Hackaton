# THESIS Company OS — Validated Commercial Alpha

This release lane preserves the existing Company OS on `main` and adds the stronger commercial implementation as a reviewable snapshot.

## Commercial additions

- SQLite-backed durable company state with WAL journaling
- Organizations, departments, missions, approvals, and hash-linked audit events
- Role boundaries for `viewer`, `analyst`, `manager`, and `owner`
- Explicit mission state machine: proposed → approved/rejected → running → completed/failed
- Company headquarters, manager brief, mission inbox, department directory, mission room, and operating audit
- Separate commercial FastAPI router and application entrypoint
- Multi-page Vite surface that preserves the full workstation
- Docker and Windows run lanes
- Local proof packet with system-test, latency, release, and hash-manifest receipts

## Practical product claim

A recurring 15–30 minute workflow across wallets, protocol sites, dashboards, simulations, and explorers becomes one governed and explained company mission.

## Validation boundary

The included proof packet records:

- 238/238 commercial validator assertions passed
- 7/7 focused Company OS backend tests passed
- production multi-page frontend build passed

This is local validation, not an external security audit. No production TVL or automatic chain broadcast is claimed.

## Integration

The snapshot is intentionally isolated under this release directory so the current `main` implementation is not overwritten. Review the SQLite/RBAC implementation and promote selected files into the primary application after repository CI passes.
