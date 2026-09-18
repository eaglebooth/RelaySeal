# RelaySeal

RelaySeal is a GenLayer intelligent contract for transferring operational authority only after the outgoing operator commits a complete handover, consensus verifies the exact evidence, the incoming operator acknowledges the exact digest, and the service controller activates the transfer.

The core rule is simple: **evidence informs; on-chain policy authorizes**. A Markdown file can describe deployments, incidents, risks and rollback steps, but it can never appoint an operator or grant execution rights.

## Authority model

1. The service controller registers the service and current operator.
2. The controller creates a revision-bound policy naming outgoing and incoming operators.
3. Both operators approve the same policy digest from their own wallets.
4. The active outgoing operator submits a commit-pinned raw GitHub Markdown URL, exact byte count, SHA-256 and one-time nonce.
5. GenLayer validators fetch that source, recompute its binding and classify it as `READY`, `INCOMPLETE`, `CONFLICTED`, `UNSAFE`, or `UNAVAILABLE`.
6. Only `READY` moves forward. The incoming operator then acknowledges the exact handover digest on chain.
7. The controller activates the transfer. Guarded operations accept only the new active operator.

## Evidence constraints

- Accepted origin: `raw.githubusercontent.com` under the service's registered repository.
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

See [`docs/test-plan.md`](./docs/test-plan.md) for wallet roles, happy path, failure paths, conflict testing and state invariants.

## Status

The codebase is deployment-ready but no contract address or live transaction evidence is claimed in this repository until an owner deploys it and the complete Studionet test matrix has finalized.
