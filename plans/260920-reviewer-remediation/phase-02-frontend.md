# Phase 2 — Frontend correctness and validation

Status: planned

## Transaction tracker

Modify `lib/genlayer.ts` and `app/page.tsx`:

1. Track `PENDING → PROPOSING → COMMITTING → REVEALING → ACCEPTED → FINALIZED` without a short client timeout.
2. Treat FINALIZED as lifecycle state, then inspect execution fields from `getTransaction`/receipt.
3. Missing optional `txExecutionResultName` must not imply failure.
4. Mark execution failure only when an explicit error/rollback result exists.
5. After finalized success, read the affected canonical record and show verified state.
6. Preserve hash and explorer link throughout tracking.

## Validation

Create `lib/validation.ts` and tests:

- address: exactly `0x` + 40 hex characters.
- digest: exactly 64 hexadecimal characters.
- byte count/revision: positive safe integer; evidence bytes capped at contract maximum.
- repository: exactly `org/repo`; reject protocol, host, query, fragment and extra segments.
- identifiers/nonces: same token charset and bounds as contract.
- pinned evidence URL: raw GitHub URL, registered repository, 40-hex commit, `.md` path.
- requirements: normalized length bounds.

Update every form field with inline errors, invalid-state styling and disabled submit until valid. Change repository placeholder to `org/repo`.

## Tests

- valid/invalid boundaries for each field type.
- method-specific form validation.
- tracker tests for explicit rollback, accepted/finalized success with absent optional result field, and delayed finalization.

## Success criteria

- Malformed input cannot open wallet signing.
- A finalized successful transaction is never labeled FAILED because an optional field is absent.
