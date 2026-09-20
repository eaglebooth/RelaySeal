# RelaySeal

RelaySeal is a GenLayer intelligent contract for transferring operational authority only after two separately authorized operators commit independent evidence, consensus compares both sources, the incoming operator acknowledges the exact digest, and the service controller activates the transfer.

Historical V1 frontend: [relayseal.vercel.app](https://relayseal.vercel.app) · historical V1 Studionet contract: `0x34e20DaAfcb0737DC34c70267B5bb06AE7BC1F31`. V2 is code-complete and awaiting a new owner deployment; do not treat V1 transactions as V2 evidence.

The core rule is simple: **evidence informs; on-chain policy authorizes**. A Markdown file can describe deployments, incidents, risks and rollback steps, but it can never appoint an operator or grant execution rights.

## Authority model

1. The service controller registers the service and current operator.
2. The controller creates a revision-bound policy naming outgoing and incoming operators.
3. Both operators approve the same policy digest from their own wallets.
4. The active outgoing operator submits a commit-pinned raw GitHub Markdown URL, exact byte count, SHA-256 and one-time nonce.
5. The incoming operator independently submits corroboration from a different policy-bound repository.
6. GenLayer validators fetch both sources, recompute both bindings and classify the combined record as `READY`, `INCOMPLETE`, `CONFLICTED`, `UNSAFE`, or `UNAVAILABLE`.
7. Only `READY` moves forward. The incoming operator then acknowledges the exact handover digest on chain.
8. The controller activates the transfer. Guarded operations accept only the new active operator.

## Evidence constraints

- Accepted origin: `raw.githubusercontent.com`; outgoing evidence must match the service repository and corroboration must match a distinct policy-bound repository.
- Required revision: a full 40-character Git commit SHA.
- Required file type: `.md`.
- Required binding: exact URL, SHA-256, byte length, service, policy, revision, actors, source role and nonce.
- The validator explicitly treats the source as untrusted and ignores embedded instructions.
- A rejected or unavailable assessment does not transfer authority.

Fixtures in [`fixtures`](./fixtures) are synthetic test payloads. They are not publisher authority and are never used as a substitute for sender checks.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Deploy [`contracts/relayseal.py`](./contracts/relayseal.py) on **GenLayer Studionet** (chain `61999`, hosted at `https://studio.genlayer.com`), then set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`. The interface keeps the transaction visible through consensus finalization and reads canonical accepted state through its server route.

## Verification

```bash
npm run lint
npm run build
python -m pytest -q
```

See [`docs/STEWARD_REMEDIATION_V2.md`](./docs/STEWARD_REMEDIATION_V2.md) for the review-fix mapping. The [live Studionet evidence](./docs/LIVE_STUDIONET_EVIDENCE.md) is explicitly the historical V1 record.

## Status

V2 passes local behavioral contract tests, lint and production build. A new Studio Next deployment, frontend address update and fresh V2 lifecycle evidence are still required before resubmission. The prior V1 deployment remains available only as historical evidence.
