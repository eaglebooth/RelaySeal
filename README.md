# RelaySeal

RelaySeal is a GenLayer intelligent contract for transferring operational authority only after two separately authorized operators commit independent evidence, consensus compares both sources, the incoming operator acknowledges the exact digest, and the service controller activates the transfer.

Live frontend: [relayseal.vercel.app](https://relayseal.vercel.app) · V2 Studionet contract: [`0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1`](https://explorer-studio.genlayer.com/address/0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1). Historical V1 transactions remain documented separately and are not presented as V2 evidence.

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

See [`docs/STEWARD_REMEDIATION_V2.md`](./docs/STEWARD_REMEDIATION_V2.md) for the review-fix mapping and [`docs/LIVE_STUDIONET_EVIDENCE_V2.md`](./docs/LIVE_STUDIONET_EVIDENCE_V2.md) for the verified V2 deployment/readback. The original [live Studionet evidence](./docs/LIVE_STUDIONET_EVIDENCE.md) is explicitly the historical V1 record.

## Status

V2 is deployed and its on-chain `get_contract_version` readback confirms schema `authority-bound-handover-v2`, version 2. Local behavioral contract tests, frontend tests, lint and production build pass. Fresh V2 lifecycle transaction evidence is still required before resubmission; the prior V1 deployment remains historical only.
