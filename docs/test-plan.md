# RelaySeal Studionet test plan

Use three roles: controller (the deployer or service registrant), outgoing operator, and incoming operator. The controller wallet should not be reused as either operator. Record every finalized transaction hash and confirm canonical readback after each successful transition.

## Happy path

1. Controller calls `register_service` with a service ID, outgoing address and repository.
2. Controller calls `create_policy` for service revision 1 and saves the returned digest.
3. Outgoing and incoming wallets independently call `approve_policy` with that digest. Verify the policy is sealed only after both transactions finalize.
4. Publish `handover-ready.md` at a full Git commit URL. Calculate SHA-256 over raw bytes and exact byte length.
5. Outgoing calls `submit_handover`; any wallet calls `assess_handover`. Verify verdict `READY` and status `AWAITING_ACCEPTANCE`.
6. Incoming calls `accept_handover` with the returned handover digest.
7. Controller calls `activate_handover`. Verify the service revision increments and active operator becomes incoming.
8. Incoming calls `perform_guarded_operation`. Verify a canonical receipt exists.

## Failure and adversarial paths

- An unrelated wallet cannot approve the policy, submit evidence, accept, activate or operate.
- Incoming cannot accept a digest that differs by one character.
- A branch URL, abbreviated commit SHA, wrong repository, query string or non-Markdown path is rejected.
- Wrong byte length or SHA-256 yields `UNAVAILABLE` and no authority mutation.
- `handover-incomplete.md`, `handover-conflicted.md`, `handover-unsafe.md` and the prompt-injection fixture never reach acceptance.
- Reusing a handover ID, nonce, operation ID or payload digest is rejected.
- Outgoing cannot perform a guarded operation after activation; incoming can.
- A stale policy revision cannot be used after the service revision changes.

## Invariants to prove from readback

- Failed or rejected transactions leave the active operator and revision unchanged.
- `READY` alone does not transfer control.
- Incoming acknowledgement alone does not transfer control.
- Activation consumes the handover and seals the policy against reuse.
- Every operation receipt binds operation ID, service ID, active operator, revision and payload digest.
