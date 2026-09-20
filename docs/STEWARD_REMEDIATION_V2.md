# RelaySeal V2 steward remediation

Status: code-complete and deployed at `0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1`; live V2 lifecycle evidence pending.

## Changes mapped to the review

1. **Finalization tracking** — the UI only reports an execution failure when GenLayer explicitly returns `FINISHED_WITH_ERROR`. A timeout is shown as `VERIFY_ON_EXPLORER`, never as a definitive failure.
2. **Repository format** — every placeholder and validator uses the contract's exact `org/repo` format.
3. **Browser validation** — addresses, IDs, repositories, SHA-256 digests, positive integers, source byte limits, requirements and commit-pinned raw Markdown URLs are validated before the wallet is invoked.
4. **Distinct errors** — malformed input, duplicate state, replay, wrong sender, stale authority and wrong lifecycle state now return separate descriptive errors.
5. **Scoped identifiers** — service keys are scoped by controller; policy and handover keys inherit that scope; nonces are scoped by policy and role; operations and payload replay guards are scoped by service.
6. **Independent evidence** — V2 requires a separately authorized incoming operator to commit a second document from a different repository. Consensus assesses both sources and returns `READY` only when they independently support the same operational facts.
7. **Behavioral tests** — the suite deploys and executes the real contract with `gltest`, including invalid inputs, controller namespace isolation, dual approval, replay guards and a complete two-source authority transfer.
8. **Lifecycle rerun** — must be performed after the owner deploys V2 to Studio Next. V1 evidence remains historical and will not be presented as proof of V2.

## Local verification

```text
python -m pytest -q -p no:cacheprovider
npm run lint
npm run build
```

## Required live follow-up

Configure the deployed V2 address, then rerun happy path, rejection path, namespace collision, malformed input and replay cases. Record each finalized transaction and canonical readback in a new `LIVE_STUDIONET_EVIDENCE_V2.md` file.
