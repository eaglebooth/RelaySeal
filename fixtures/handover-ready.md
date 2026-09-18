# SYNTHETIC TEST FIXTURE — Production Handover

Expected verdict: READY. This document does not grant authority.

Fixture classification: synthetic; no real incident or production system.

- Service: payments-api
- Policy ID: payments-prod-v1
- Revision: 1
- Deployment: v4.8.2 / commit 81ad09f / ap-southeast-1

## Open incidents

INC-204 remains open at severity 2. Retries are elevated for issuer group B.

Owner: outgoing-operator. Deadline: 2026-09-18T09:00:00Z.

## Unresolved risks

Retry volume may exceed worker headroom during the 09:00 UTC peak.

## Rollback point

Rollback to v4.8.1 at commit 72b901c. The schema remains backward compatible.

## Pending actions

- Alice owns issuer-B log review before 08:30 UTC.
- Bob owns worker headroom confirmation before 08:45 UTC.

## Incoming acknowledgement scope

The incoming operator must acknowledge INC-204, rollback commit 72b901c, both
pending actions, and the peak-volume risk.
