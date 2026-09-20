# Phase 4 — Evidence, website and resubmission

Status: blocked until V2 live matrix completes

## Repository and evidence

1. Preserve `docs/LIVE_STUDIONET_EVIDENCE.md` as clearly labeled V1 historical evidence.
2. Add `docs/LIVE_STUDIONET_V2_EVIDENCE.md` with:
   - V2 address/schema/version.
   - fixture commit URLs, hashes and byte counts.
   - two-source provenance and role authorization.
   - linked Studionet Explorer transactions.
   - canonical before/after state.
   - frontend production tracker proof.
3. Update README, `.env.example`, live frontend and Vercel production address to V2.

## Steward response

Respond point by point:

1. Tracker now reads true terminal and execution state; attach tracker regression/live proof.
2. Placeholder is `org/repo`; attach validation test.
3. All forms validate locally; enumerate validators.
4. Contract errors are distinct; link behavioral error tests.
5. IDs/replays are namespaced; link cross-service test and live hashes.
6. READY requires independent corroboration; link matching/conflicting source tests.
7. Behavioral suite executes authorization, replay and transition paths.
8. Evidence was regenerated exclusively against V2.

## Success criteria

- Production URL and GitHub default branch expose V2.
- Evidence links resolve to the V2 explorer records.
- Resubmission contains no unsupported claims.
