# Winverse

## Current State
Full-stack color prediction gaming platform on ICP. Backend (Motoko) is complete and correct. Frontend has 3 critical bugs:
1. HomePage timer resets every 3s because `fetchRoundRef` calls `setTimeLeft(diff)` directly from backend, conflicting with local ticker
2. Round number shows "—" because of timer bug (round state depends on the same broken fetch)
3. ReferralPage shows "------" because `getReferralInfo` response parsing needs robustness
4. AdminPage timer already uses correct `roundEndTimeRef` approach but needs verification

## Requested Changes (Diff)

### Add
- `roundEndTimeRef` in HomePage (same pattern as AdminPage)
- Loading states for referral code
- Robust error handling on all backend calls

### Modify
- HomePage: replace `setTimeLeft(diff)` in backend fetch with `roundEndTimeRef.current = endMs`, compute timeLeft from ref in ticker
- ReferralPage: add loading state, retry logic, and better error display
- AdminPage: verify roundEndTimeRef pattern is correct, fix any remaining issues
- Backend lib: ensure getReferralInfo parsing handles all edge cases

### Remove
- Stale closure pattern in HomePage fetchRoundRef (useRef initialized once)
- Direct `setTimeLeft` from backend in HomePage

## Implementation Plan
1. Rewrite HomePage.tsx with roundEndTimeRef timer fix
2. Rewrite ReferralPage.tsx with robust loading/error state
3. Verify/fix AdminPage.tsx timer and all admin features
4. Ensure lib/backend.ts getReferralInfo parsing is robust
5. Validate build
