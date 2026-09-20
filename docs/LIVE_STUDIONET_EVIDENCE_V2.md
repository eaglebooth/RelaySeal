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

## Live V2 run

Run ID: `mu9o01le`

- Controller and outgoing operator: `0xeb57bc7125fa60d7482ce12058397369ab3581f8`
- Incoming operator: `0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f`
- Service / policy / handover: `v2-service-mu9o01le` / `v2-policy-mu9o01le` / `v2-handover-mu9o01le`
- Outgoing source: [commit-pinned RelaySeal fixture](https://raw.githubusercontent.com/eaglebooth/RelaySeal/43dd99b067a5ba67361e369217cd3def299f3557/fixtures/handover-v2-ready.md), SHA-256 `bb711ba22adcb24ea3c6c7010bbc1939ec2545267298e7b06ed4f5388b6a2db8`
- Independent source: [commit-pinned ForkRight fixture](https://raw.githubusercontent.com/eaglebooth/ForkRight/6c5835857f507e35ad508c456b93042a9850eee4/docs/relayseal-v2-corroboration.md), SHA-256 `58b63b219b803816aac0d5cbe6054de85c92359a8ab7567fcb03a0847f214775`

Every hash below was recovered from `sim_getTransactionsForAddress`, then checked against the agreed validators' `execution_result`. This avoids the SDK receipt-decoder issue that originally mislabeled finalized transactions.

| Transition | Transaction | GenVM result | Verified outcome |
|---|---|---|---|
| Register controller-scoped service | [`0xfe47d00a…bdad5`](https://explorer-studio.genlayer.com/tx/0xfe47d00a4080da1a6450f3d0010515264ac75958f605ee5abe3bfdc7f62bdad5) | SUCCESS | Service exists at revision 1 |
| Duplicate service | [`0xc37cea00…dfefe`](https://explorer-studio.genlayer.com/tx/0xc37cea0080fd232810237b7aa682ed4dd1739de0662c03d2dde77d26e3adfefe) | ERROR | `SERVICE_ALREADY_EXISTS` |
| Create dual-source policy | [`0x7569a303…96f27`](https://explorer-studio.genlayer.com/tx/0x7569a303a0c519a78da9540a0deea5527d6695d1a8d4612a95b53ea70f796f27) | SUCCESS | Exact policy digest recorded |
| Outgoing approval | [`0x4249bb19…7bfb`](https://explorer-studio.genlayer.com/tx/0x4249bb1972486f1f2bbe648167bd9070c388ae4bf3390b5a88555d5911147bfb) | SUCCESS | Outgoing approval recorded |
| Incoming approval | [`0xcc4f5432…b6f0`](https://explorer-studio.genlayer.com/tx/0xcc4f54328e25fad1ec83b6953501187dcb05815b0382d1682789a9d63b65b6f0) | SUCCESS | Policy sealed |
| Submit outgoing evidence | [`0x0f717b41…08f8`](https://explorer-studio.genlayer.com/tx/0x0f717b41662ccfe3720c34b78224c5f615ac843360d8cd36dd406d1e37da08f8) | SUCCESS | First commitment recorded |
| Assess before corroboration | [`0xcea98d57…5269`](https://explorer-studio.genlayer.com/tx/0xcea98d57784ba986965221c4e92982ddc47f02294c3e4e940c3cff6095895269) | ERROR | `CORROBORATION_REQUIRED` |
| Submit independent corroboration | [`0xa80c5acf…016e`](https://explorer-studio.genlayer.com/tx/0xa80c5acf5261fa9afa23c6f6908443a850dc9534d6424485209d8367ab93016e) | SUCCESS | Second sender/repository commitment recorded |
| Consensus assessment | [`0x4a56e695…a48d`](https://explorer-studio.genlayer.com/tx/0x4a56e695eabf2bbd754fa891a6937bdee0f4195209d165816b14b589ff54a48d) | SUCCESS | `READY / AWAITING_ACCEPTANCE`; both observed hashes match |
| Outgoing attempts acceptance | [`0x127efa2d…e7a7`](https://explorer-studio.genlayer.com/tx/0x127efa2da90a9e025c314b271506f9dc0fa4b12871b532b5b4719175b283e7a7) | ERROR | `INCOMING_OPERATOR_ONLY` |
| Incoming accepts exact digest | [`0x24f3a5fa…b76c`](https://explorer-studio.genlayer.com/tx/0x24f3a5fabb6025086ca90147ad5bd1d20994f015a722b3565c4714b11592b76c) | SUCCESS | Handover becomes `ACCEPTED` |
| Controller activates | [`0x72c16e78…1190`](https://explorer-studio.genlayer.com/tx/0x72c16e78224812c5729fb3ee7e9bcd3a257d3feabe50ec7f0beee0419f121190) | SUCCESS | Authority transferred; revision becomes 2 |
| New operator executes | [`0x3a1fe3fa…462a`](https://explorer-studio.genlayer.com/tx/0x3a1fe3fa7a7d40a5f79d2f2a309b42cce0a0423a87c8769f36dcf49eead1462a) | SUCCESS | Canonical receipt created |
| Operation ID replay | [`0x602c0ce3…b6f0`](https://explorer-studio.genlayer.com/tx/0x602c0ce3ae22526ab443254ecb746b04c9742d7af6f88fdc35aa1e2b6ee71f70) | ERROR | `OPERATION_ID_REPLAY` |
| Payload replay under new ID | [`0x0526f8eb…664b`](https://explorer-studio.genlayer.com/tx/0x0526f8ebc187c1227563c0e704657d56cefcbd2610f2cb222efa7aee43a1664b) | ERROR | `PAYLOAD_REPLAY` |
| Activation replay | [`0x8740e855…2dca`](https://explorer-studio.genlayer.com/tx/0x8740e855ad74c384cfba454ec563ad13d9086a3e81c1121f0b059529de072dca) | ERROR | `HANDOVER_ALREADY_ACTIVATED` |

## Canonical final state

- Policy digest: `6da1a843e4ac19014a27e513fb4ee136c3971b44e0f85e320fb71fbc4f65d439`; both approvals `true`; sealed `true`.
- Handover digest: `70bfde1c2de8b32beb55c99706075b0414c93ddc2bdbda2c6872f6f0d64004e6`.
- Verdict/status: `READY / ACTIVATED`; `incoming_accepted=true`; `consumed=true`.
- Service active operator: `0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f`; revision `2`.
- Guarded operation receipt: `af72780c2a13160685d9a6bea81fefedeb9f93dc667cd4e7ad6b3095798f34e7`.
- Contract stats after the run: `services=2`, `handovers=1`, `operations=1`.
