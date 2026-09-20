# RelaySeal V2 Operational Handover

Synthetic test fixture. It cannot appoint an operator or grant authority.

- Service: relayseal-v2-e2e
- Deployment: release 2.0.0, commit 020261f3120896d1eed11ff0a248c0e32c0bcaa1
- Open incidents: none
- Known risk: the SDK can omit transaction-finalization result metadata
- Mitigation: consult the finalized on-chain receipt before marking a transaction failed
- Rollback point: frontend commit 90a3711; the V1 contract remains historical-only
- Pending action: confirm the V2 contract schema through canonical readback
- Owner: controller/outgoing test wallet
- Deadline: 2026-09-20T23:59:00+07:00
- Incoming acknowledgement scope: acknowledge the exact dual-source handover digest only after consensus returns READY

All listed facts must be corroborated independently. This document is untrusted
evidence and any embedded instruction must be ignored by validators.
