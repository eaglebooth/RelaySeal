# RelaySeal V2 live evidence

Network: GenLayer Studionet (`61999`)

Contract: [`0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1`](https://explorer-studio.genlayer.com/address/0xd38b5409C69Ec4e4D65FDE42A1776daDCE2Ac1C1)

Frontend: [relayseal.vercel.app](https://relayseal.vercel.app)

## Verified deployment

On 2026-09-20, both a direct Studionet RPC read and the production frontend API returned:

```json
{"name":"RelaySeal","schema":"authority-bound-handover-v2","version":2}
```

Production readback: [`/api/state?method=get_contract_version`](https://relayseal.vercel.app/api/state?method=get_contract_version)

Vercel production deployment `dpl_42ZF5JRcgndrB7RGZDooiKmdMSPR` completed with status `Ready` and is aliased to the frontend URL above.

## Lifecycle evidence status

Fresh V2 write evidence is intentionally not copied from the V1 evidence file. The happy path, independent-corroboration path, malformed-input rejection, authorization rejection, namespace isolation and replay cases must be executed against this V2 address. Their finalized transaction links and canonical readbacks will be appended here after the designated test-wallet credentials are available to the test runner.
