# More Information — RelaySeal V2 Submission

## Steward Review Remediation

The steward requested eight corrections before RelaySeal could be reviewed again:

1. Make the frontend transaction tracker reflect finalized on-chain execution instead of reporting false failures after a local timeout or SDK decoding error.
2. Correct the repository input from the misleading `github.com/org/repo` placeholder to the contract's accepted `org/repo` format.
3. Validate all write inputs in the browser before requesting a wallet signature.
4. Replace collapsed error states with distinct, descriptive failures.
5. Scope identifiers and replay protection so unrelated controllers and services cannot collide.
6. Strengthen the evidence model beyond one self-supplied Markdown document.
7. Replace static source-text assertions with behavioral tests.
8. Repeat and document the full live lifecycle after the fixes.

All eight items are implemented in RelaySeal V2 and exercised against the deployed contract.

## 1. Finalized Transaction Tracking

The original frontend relied on `waitForTransactionReceipt()`. During live testing, that SDK path threw `SyntaxError: Unexpected string` even after transactions had finalized successfully on chain. It could therefore display `FAILED` for a transaction whose state transition was already accepted.

The production tracker now:

```text
broadcast transaction
→ poll getTransaction(hash)
→ wait for FINALIZED, CANCELED or UNDETERMINED
→ inspect execution_result from validators whose vote is agree
→ SUCCESS only when agreed GenVM execution is SUCCESS
→ show the specific contract exception when agreed execution is ERROR
```

A tracking timeout is reported as `VERIFY_ON_EXPLORER`, not as a definitive transaction failure. Missing optional receipt metadata is never treated as failure.

This behavior is covered by frontend behavioral tests and was validated against the live V2 transaction ledger.

## 2. Exact Repository Format

The UI, validation layer and documentation now consistently require:

```text
org/repo
```

Inputs such as `github.com/org/repo` fail before wallet signing. This matches the parser enforced by the intelligent contract.

## 3. Browser-Side Validation

Every write form now validates its complete payload before enabling submission:

- Controller and operator addresses must be 20-byte `0x` addresses.
- Service, policy, handover, operation and nonce identifiers accept only bounded letters, digits, dots, dashes and underscores.
- Repositories must use exact `org/repo` format.
- SHA-256 values must contain exactly 64 hexadecimal characters without `0x`.
- Revision and byte-count inputs must be positive safe integers.
- Evidence byte counts are limited to `1–20,000`.
- Evidence URLs must be HTTPS `raw.githubusercontent.com` Markdown URLs pinned to a full 40-character commit SHA.
- Policy requirements must be between 40 and 1,500 normalized characters.

Invalid fields display a specific inline error and cannot open the wallet transaction prompt.

## 4. Distinct Contract Errors

V2 separates malformed input, duplicated state, replay, wrong actor and invalid lifecycle transitions. Examples include:

- `INVALID_SERVICE_ID`
- `INVALID_OPERATOR_ADDRESS`
- `INVALID_REPOSITORY`
- `SERVICE_ALREADY_EXISTS`
- `POLICY_ALREADY_EXISTS`
- `CORROBORATION_REQUIRED`
- `INCOMING_OPERATOR_ONLY`
- `OPERATION_ID_REPLAY`
- `PAYLOAD_REPLAY`
- `HANDOVER_ALREADY_ACTIVATED`

The frontend extracts the agreed GenVM exception and presents that exact reason instead of collapsing unrelated cases into a generic failure.

## 5. Controller and Service Namespaces

Global predictable identifiers were replaced with hierarchical keys:

```text
service = controller : service_id
policy = service_key : policy_id
handover = policy_key : handover_id
nonce = policy_key : source_role : nonce
operation = service_key : operation_id
payload = service_key : payload_digest
```

The same human-readable `service_id` can therefore be registered independently by different controllers. A caller cannot squat on another controller's identifier or create replay collisions across unrelated services.

## 6. Independent Corroboration

V1 assessed one document submitted by the outgoing operator. V2 requires two separately authorized commitments:

1. The active outgoing operator submits evidence from the service repository.
2. The policy-bound incoming operator submits corroboration from a different repository.
3. Each source is independently bound to its exact commit-pinned URL, byte length, SHA-256 and role-scoped nonce.
4. Assessment is blocked until both sources exist.
5. Validators refetch both sources and require agreement on deployment, incidents, risks, mitigation, rollback, actions, owner, deadline and acknowledgement scope.

The bounded outcomes remain:

```text
READY | INCOMPLETE | CONFLICTED | UNSAFE | UNAVAILABLE
```

Markdown remains untrusted evidence. Authority comes only from the transaction sender and the current on-chain policy.

## 7. Behavioral Verification

Static tests that only searched for strings in source files were removed. The Python suite now deploys and executes the real contract through GenLayer Direct Mode.

Behavioral coverage includes:

- Contract deployment and V2 schema readback.
- Distinct malformed-input rejection.
- Controller namespace isolation.
- Independent repository enforcement.
- Exact-digest approval by both policy parties.
- Wrong-sender rejection.
- Operation-ID and payload replay protection.
- Full two-source `READY → ACCEPTED → ACTIVATED` lifecycle.
- Canonical authority transfer and operation receipt.

Frontend tests exercise field validation and agreed-validator execution classification.

Current verification result:

- Python/Direct Mode: **11 passed**
- Frontend behavioral tests: **6 passed**
- ESLint: **PASS**
- TypeScript and production build: **PASS**

## 8. Live V2 Lifecycle

The complete corrected lifecycle was executed on Studionet using two separate test wallets.

Identifiers:

```text
service:  v2-service-mu9o01le
policy:   v2-policy-mu9o01le
handover: v2-handover-mu9o01le
```

Verified happy-path transactions:

- [Register scoped service](https://explorer-studio.genlayer.com/tx/0xfe47d00a4080da1a6450f3d0010515264ac75958f605ee5abe3bfdc7f62bdad5)
- [Create dual-source policy](https://explorer-studio.genlayer.com/tx/0x7569a303a0c519a78da9540a0deea5527d6695d1a8d4612a95b53ea70f796f27)
- [Outgoing approval](https://explorer-studio.genlayer.com/tx/0x4249bb1972486f1f2bbe648167bd9070c388ae4bf3390b5a88555d5911147bfb)
- [Incoming approval](https://explorer-studio.genlayer.com/tx/0xcc4f54328e25fad1ec83b6953501187dcb05815b0382d1682789a9d63b65b6f0)
- [Submit outgoing evidence](https://explorer-studio.genlayer.com/tx/0x0f717b41662ccfe3720c34b78224c5f615ac843360d8cd36dd406d1e37da08f8)
- [Submit independent corroboration](https://explorer-studio.genlayer.com/tx/0xa80c5acf5261fa9afa23c6f6908443a850dc9534d6424485209d8367ab93016e)
- [Consensus returns READY](https://explorer-studio.genlayer.com/tx/0x4a56e695eabf2bbd754fa891a6937bdee0f4195209d165816b14b589ff54a48d)
- [Incoming accepts exact digest](https://explorer-studio.genlayer.com/tx/0x24f3a5fabb6025086ca90147ad5bd1d20994f015a722b3565c4714b11592b76c)
- [Controller activates transfer](https://explorer-studio.genlayer.com/tx/0x72c16e78224812c5729fb3ee7e9bcd3a257d3feabe50ec7f0beee0419f121190)
- [New operator performs guarded operation](https://explorer-studio.genlayer.com/tx/0x3a1fe3fa7a7d40a5f79d2f2a309b42cce0a0423a87c8769f36dcf49eead1462a)

Verified rejection paths:

- Assessment before corroboration: `CORROBORATION_REQUIRED`
- Outgoing attempts incoming-only acceptance: `INCOMING_OPERATOR_ONLY`
- Operation ID replay: `OPERATION_ID_REPLAY`
- Payload replay: `PAYLOAD_REPLAY`
- Activation replay: `HANDOVER_ALREADY_ACTIVATED`

The final canonical state is:

```text
policy sealed = true
verdict = READY
handover status = ACTIVATED
incoming_accepted = true
consumed = true
service revision = 2
active operator = incoming operator
```

The observed SHA-256 values for both sources exactly match their on-chain commitments. Full hashes, rejection transactions and canonical readbacks are recorded in [`docs/LIVE_STUDIONET_EVIDENCE_V2.md`](docs/LIVE_STUDIONET_EVIDENCE_V2.md).

## Reviewed Deployment

Studionet contract:

[`0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1`](https://explorer-studio.genlayer.com/address/0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1)

RPC readback:

```json
{"name":"RelaySeal","schema":"authority-bound-handover-v2","version":2}
```

Production frontend:

[https://relayseal.vercel.app](https://relayseal.vercel.app)

The production API targets the V2 address and returns the same schema/version readback. V1 transaction evidence remains explicitly historical and is not presented as proof of V2 behavior.
