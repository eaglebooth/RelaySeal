# RelaySeal Handover Policy

Fixture classification: synthetic test input, not a real operational policy.
This document does not grant authority.

- Service: payments-api
- Policy ID: payments-prod-v1
- Revision: 1
- Required source role: outgoing-operator

## Required sections

Current deployment, open incidents, unresolved risks, rollback point, pending
actions, accountable owners, deadlines, and incoming acknowledgement scope.

## Verdict rules

- READY only when all material facts are specific and internally consistent.
- INCOMPLETE when a required section or consequential fact is missing.
- CONFLICTED when material statements cannot simultaneously be true.
- UNSAFE when the described transfer lacks a viable rollback or leaves a critical
  risk without an accountable owner.
- UNAVAILABLE when source integrity or availability cannot be established.
