# Phase 3 — Deployment and adversarial E2E

Status: blocked until Phases 1–2 pass and owner deploys V2

## Pre-deployment gate

- Contract schema generation succeeds on Studionet.
- Behavioral tests, frontend tests, lint and production build pass.
- Secret scan is clean.
- Review all V2 public write/read signatures against frontend actions.

## Live matrix

Use the two designated test wallets only for operational roles. Owner wallet only deploys.

1. Register two services with overlapping human-readable IDs to prove namespace isolation.
2. Create and co-sign policy.
3. Submit outgoing evidence and independent corroboration.
4. Assess matching sources to READY.
5. Accept exact handover digest and activate once.
6. Verify old operator blocked and new operator accepted.
7. Run malformed address/digest/byte/repository cases through frontend validation without signing.
8. Run wrong-role, duplicate, same-scope replay and cross-service non-collision calls on-chain.
9. Run contradictory evidence to CONFLICTED and incomplete evidence to INCOMPLETE.
10. Exercise one production-UI wallet transaction and confirm tracker matches Explorer/final canonical readback.

## Success criteria

- Each write has a transaction hash, expected execution result and post-state assertion.
- Failure transactions prove no state mutation.
- No V1 hash is reused as V2 proof.
