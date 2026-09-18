# RelaySeal live Studionet evidence

Network: GenLayer Studionet (`61999`)

Contract: `0x34e20DaAfcb0737DC34c70267B5bb06AE7BC1F31`

The two wallets below are test roles. No private keys are stored in this repository.

- Controller and incoming operator: `0xeb57bc7125fa60d7482ce12058397369ab3581f8`
- Outgoing operator: `0x2da5393d7bbb9a037dc3abB56dbbc5c150fc843f`
- Service: `relay-mu6g0vac`
- Policy: `policy-mu6g0vac`
- Policy digest: `d6a4c21b7cfb80994f85aef476bd5c0dbf3b4a35ae607f6fd856ee67c478e335`

## Authority and policy

| Scenario | Transaction | Verified outcome |
| --- | --- | --- |
| Register service | `0xf2b54ebaf2368625aa995a6feda9a08b92874ca53e7769be0fc5cf0a4cb6bd52` | Controller and outgoing operator bound |
| Outgoing attempts controller-only policy creation | `0x6ffdf1fc27b767840beb1dfb1b789bb6d444ec3529f91e10bb2281aa845d013a` | No policy created |
| Controller creates policy | `0x30c5448ed9c59e97a048337349d3c71b5257c73ec004ee20b404ecdc8c92ecaf` | Exact digest recorded |
| Incoming submits wrong digest | `0xe1341f54868fbd69e356a2cbd7e2bd2e23f1771de1f919c426c4ac2a0a264328` | Approval remains false |
| Outgoing approves | `0xedc246d5787c5dec502eb541e17964156a7cbc0d9d7f0be24897bc1065bde053` | Partial approval only |
| Incoming approves | `0x5eba0838beb0b686c1bc654aaa7d128622c424991296669e8ad45c8b961310ea` | Policy sealed |
| Duplicate approval | `0x744f5f1cda59ae0563f53421079a1b44ccf9218538592c752e4bf8ea2993cd83` | Sealed policy unchanged |

## Evidence validation and rejection

| Scenario | Transaction | Verified outcome |
| --- | --- | --- |
| Non-operator submits evidence | `0xdff44452a4247f5afca99d8e5b992509915b98e50111ce415e3f294f09be6e5f` | No handover created |
| Non-raw/non-pinned origin | `0x102138bf88f63e901f8541aeb4387f7ad54a1864b2128271f01b0612a7ad3cd7` | No handover created |
| Commit wrong digest | `0xdfd81f316232628ae941a4cc47a13fccd7be3548a46fea1f25d9c99e438006de` | Commitment created for assessment |
| Assess wrong digest | `0xf8f5d49762fe2c836ef5c18bf2e601ee0f7454c830cda7f3b3285d76933ab93d` | `UNAVAILABLE / REJECTED`, unconsumed |
| Replay nonce | `0x24a03747947ac96f95da21d3425aa5af3ec64a84cd56f64bcf0ed4f40190030d` | No handover created |
| Commit exact public evidence | `0xec48c402a9e2b52c5f4778d02a87db8d35f2f3f6fcf27ca4f81e4b3316d4daf3` | URL, bytes and SHA-256 bound |
| Assess incomplete evidence | `0x6340d8a94cb522b2ce448f1605285b113c3ccb172778e2209db0789e670482c0` | `INCOMPLETE / REJECTED`, observed hash matches |

The exact source was `eaglebooth/ForkRight@e3e09304f38ab42ca31478cb601a99238f813811/docs/LIVE_V2_E2E_EVIDENCE.md`, 7,894 bytes, SHA-256 `b4ffe513847b3d1f2289c8b65232a67a402b80a7921ec0f7bb12ad47c20d66ff`.

## Operation and transition guards

| Scenario | Transaction | Verified outcome |
| --- | --- | --- |
| Active outgoing operation | `0x51be914093ece42a370d8e4c335c1290ce842acdfc0f524d090ad0246c83e67a` | Canonical receipt `954f6078…dd92a` |
| Operation-ID replay | `0x9edc875a05f71e4add39423307de6198bf2ba2b7cfbcbf812360de939590105e` | Original receipt unchanged |
| Payload replay under new ID | `0xe8ae30997d7bd45c9b76487ed709bfbcf23bba787954df6d72e255ab4807023f` | No receipt created |
| Inactive incoming operation | `0xe6a0b34cba5f8c8cb7a37e7820ad5c0ec2ea14fee24f5aca76bbcd8b93dee618` | No receipt created |
| Outgoing tries to accept rejected handover | `0x137bdf0eea6ad0c5e61531d42be0f3ec0611cd4ca43e51a60f3182799cee4d4f` | Handover unchanged |
| Incoming tries to accept non-READY handover | `0xc5d302c68f1964651a4df1369da8206110c4d042ac3f0a9f171b05fd23a67b76` | Handover unchanged |
| Controller tries to activate rejected handover | `0xbc44846f9168b874dcb65fa80325e1ecb8e0a1035610c183fabab8692a507210` | Handover unchanged |

Final canonical state for this test service remains revision `1`, active operator `0x2da5…843f`, with the tested rejected handover unaccepted and unconsumed.

## Successful READY lifecycle and authority transfer

This run uses service `ready-service-mu6he9cq`, policy `ready-policy-mu6he9cq`, and handover `ready-handover-mu6he9cq`. The source is the 944-byte commit-pinned fixture [`handover-ready.md`](https://raw.githubusercontent.com/eaglebooth/RelaySeal/de0ffa7d486e90ace7a2714e9813ea26878dee40/fixtures/handover-ready.md), with SHA-256 `1eccfb151455a0229189f9d3efbedda06516f3b04c6e606e8efa08c229bb50af`.

| Scenario | Transaction | Verified outcome |
| --- | --- | --- |
| Register transfer-test service | `0xa8f6b093e971d65a4be9d6bae1951dc7729043ebd7f1fcf840067758203d8eae` | Controller and outgoing authority recorded at revision 1 |
| Create transfer policy | `0x5f668823aae60df781ab8da66ad107ba4686479b5dd3d5bf5041f2fd2511040e` | Repository-bound policy created |
| Outgoing approves exact policy digest | `0x6ddb946e6febd44ea52a7e070ddc93ef9568dac8f036a1367e2711d9eb109cd4` | Outgoing approval recorded |
| Incoming approves exact policy digest | `0x5951f38a7023b16aff977ea4d7a97faefe7e8c6ff1c3941b10b47dd64d044514` | Dual approval seals policy |
| Submit pinned READY fixture | `0x5cc3410b9030da0db0205506fe69d5a91921235cef3da24727e81191aeab143b` | URL, byte length, SHA-256 and nonce committed |
| Decentralized assessment | `0x49176d69c92515033ca69b562bba5bc22b68e06cf57a69cbd3a2098ea4f5ab84` | `READY / AWAITING_ACCEPTANCE`; observed SHA-256 matches commitment |
| Outgoing attempts incoming-only acceptance | `0xe221b10a231131285ae13984464fa55bd4eef8f2b9ae71153f981e9772889963` | No acceptance or state mutation |
| Incoming accepts exact handover digest | `0xcf097dc4d26e40da7c407a9567adb1633ce27954c0b29b30e9e2d41e694b004f` | Handover becomes `ACCEPTED` |
| Controller activates transfer | `0xb6ac6c34c181bcd97990516224f132b4342da2dd5a3e499e4a0a982d0678c1fc` | Handover becomes `ACTIVATED` and consumed; authority moves to incoming; revision becomes 2 |
| Former operator tries guarded operation | `0xa5a97cef207998b80d8c4d0076f2c414894ecfb56604d4d644fade57322e8a9d` | No operation receipt created |
| New operator performs guarded operation | `0x51145ece337234fc512a7c4d970c5d7871e2306a9153604a993d908de019343e` | Canonical receipt `9e7a088f…98713` recorded |
| Controller attempts activation replay | `0x2c41d9ad2f04055550ee0ab6c2c2eefb671a98d0e0047ac6edd9fac9fd999505` | Revision remains 2; handover remains consumed and `ACTIVATED` |

Final readback: active operator `0xeb57…81f8`, service revision `2`, verdict `READY`, status `ACTIVATED`, `incoming_accepted=true`, and `consumed=true`. This verifies the complete successful lifecycle as well as wrong-role, stale-authority, and replay failure paths.
