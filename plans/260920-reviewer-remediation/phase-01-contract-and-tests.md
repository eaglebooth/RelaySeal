# Phase 1 — Contract V2 design and behavioral tests

Status: planned

## Contract changes

Modify `contracts/relayseal.py`:

1. Return version/schema `2` / `authority-bound-handover-v2`.
2. Split every combined validation branch into stable errors, including:
   - `INVALID_SERVICE_ID`, `INVALID_OPERATOR_ADDRESS`, `INVALID_REPOSITORY`, `SERVICE_ALREADY_EXISTS`.
   - Equivalent distinct invalid/not-found/duplicate/replay errors for policies, handovers and operations.
3. Namespace storage keys:
   - policy key: `service_id + policy_id`.
   - handover key: `service_id + policy_id + handover_id`.
   - nonce key: policy scope + nonce.
   - operation receipt key: service scope + operation ID.
   - payload replay key: service scope + payload digest.
4. Extend handover evidence to two independently authorized sources:
   - outgoing operational handover submitted by current outgoing operator.
   - corroboration submitted by controller or incoming operator from a separately registered repository/path.
5. Bind both URLs, hashes, byte counts, submitter roles and nonces into the handover digest.
6. Assess both sources in consensus. READY requires compatible facts and complete required fields; disagreement becomes CONFLICTED.
7. Preserve fail-closed transitions: only READY → incoming exact-digest acceptance → controller activation.

## Behavioral tests

Replace `tests/test_contract_static.py` with executable tests. Prefer `gltest` direct execution when compatible with the pinned runner; otherwise create an executable state-machine harness that imports shared validation/state logic rather than inspecting source strings.

Required cases:

- malformed input returns the exact descriptive error and no mutation.
- duplicate service differs from malformed service.
- controller/outgoing/incoming authorization paths.
- policy digest mismatch and duplicate approval.
- two sources READY; missing corroboration cannot reach READY.
- contradictory sources become CONFLICTED.
- malformed evidence, byte mismatch and digest mismatch reject.
- cross-service identical IDs/nonces/payloads do not collide.
- same-scope replays fail.
- activation transfers authority once; old operator fails; new operator succeeds.

## Success criteria

- Tests invoke behavior and assert state/output/errors.
- No test passes merely because a string exists in source.
- V1 storage is not assumed compatible with V2.
