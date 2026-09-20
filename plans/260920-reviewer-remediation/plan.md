# RelaySeal reviewer remediation plan

Date: 2026-09-20

Goal: resolve all eight steward findings, deploy a clean V2 contract, verify the corrected frontend and on-chain lifecycle, then resubmit with version-specific evidence.

## Root causes

1. Frontend treats missing `txExecutionResultName` as failure even when consensus finalized successfully.
2. Repository placeholder includes `github.com/`, while `_repository` accepts only `org/repo`.
3. Write forms serialize unchecked strings/numbers directly into signed transactions.
4. Contract validation combines malformed, missing and replay cases under shared exceptions.
5. User-controlled identifiers and replay keys are global instead of service/policy scoped.
6. READY depends on a single self-authored Markdown source.
7. Tests inspect source strings and fixture text rather than executing state transitions.
8. Evidence describes V1 and must not be presented as proof of corrected V2.

## Phases

- [Phase 1 — Contract V2 design and behavioral tests](./phase-01-contract-and-tests.md)
- [Phase 2 — Frontend correctness and validation](./phase-02-frontend.md)
- [Phase 3 — Deployment and adversarial E2E](./phase-03-deploy-and-e2e.md)
- [Phase 4 — Evidence, website and resubmission](./phase-04-evidence-and-resubmit.md)

## Key decisions

- Deploy V2 as a new contract. Do not mutate or relabel V1 evidence.
- Namespace IDs and replay keys with canonical service/policy context.
- Require two independent evidence sources before READY: outgoing handover plus incoming/controller corroboration, each commit-pinned and hash-bound.
- Determine frontend success from final canonical transaction state and execution result, with explicit terminal-state handling and post-write readback.
- Replace source-string tests with executable contract/model state-machine tests plus frontend validation/status tests.

## Dependencies

- Owner deploys the reviewed V2 contract or authorizes deployment from the owner wallet.
- Two public, commit-pinned Markdown sources are required for live READY testing.
- Vercel and repository configuration must be updated only after V2 address finalizes.

## Definition of done

- Every steward item has a code change and an executable regression test.
- Lint, TypeScript build and behavioral tests pass.
- V2 happy path, malformed input, wrong-role, conflict, replay and namespace-isolation paths finalize on Studionet.
- New evidence document links every V2 transaction to Studionet Explorer.
- Frontend production reads V2 state and tracks a live transaction accurately.
- Resubmission response maps each of the eight findings to concrete fixes and proof.

## Unresolved operational input

- V2 deployment requires the project owner wallet. No private owner key will be stored in the repository.
