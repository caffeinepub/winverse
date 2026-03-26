# Winverse — Full Working Rebuild

## Current State
The app has:
- Motoko backend (`main.mo`) — fully correct with all features
- Custom `lib/backend.ts` that creates an ICP actor from `winverse.did.js` IDL
- Frontend pages: AuthPage, HomePage, ReferralPage, WalletPage, AccountPage, AdminPage
- Admin panel at `/admin`

**Root Problems Identified:**
1. `winverse.did.js` IDL factory ignores the `IDL` parameter passed by `Actor.createActor` and uses a module-level imported `IDL` instead. All record types (UserPublic, RoundPublic, etc.) are defined at module level using the imported IDL — this can cause type incompatibility when the SDK creates the actor.
2. `lib/backend.ts` actor init can fail silently (no retry, promise caching issues) causing all backend calls to fail — which is why ALL features break simultaneously.
3. Admin panel timer stops when `roundEndTimeRef.current` is 0 (backend call never set it) or when a new round starts but ref isn't updated.
4. `signup` returns `(Nat, Text)` — two return values; some edge cases in actor decoding.
5. No loading/error states shown to user when backend is initializing.

## Requested Changes (Diff)

### Add
- Proper loading state in AuthPage while backend initializes
- Error boundary for backend failures (show friendly message)
- AccountPage full implementation (view profile, edit name, logout, bet history)

### Modify
- `winverse.did.js`: move ALL type definitions inside factory function, use passed IDL param — fixes serialization bugs
- `lib/backend.ts`: use `createActorWithConfig` from `config.ts` (official Caffeine actor) with the correct IDL; add retry logic; fix `getActor` to not use stale promise cache on error
- `AdminPage.tsx`: fix timer — initialize `roundEndTimeRef.current` on first data load; handle round transitions; make timer robust even if a polling cycle fails
- All pages: ensure proper null checks, loading states, and error handling
- `BottomNav.tsx`: fix `position: absolute` for the active indicator (needs `relative` on parent)

### Remove
- Nothing removed

## Implementation Plan
1. Rewrite `winverse.did.js` — factory uses passed IDL, all types defined inside factory
2. Rewrite `lib/backend.ts` — use `config.ts`'s `createActorWithConfig` approach with the Winverse IDL; OR fix the existing custom actor approach with proper error handling and retry
3. Fix `AuthPage.tsx` — ensure signup/login work, show signup bonus message
4. Fix `HomePage.tsx` — ensure game round loads, timer works, bets work
5. Fix `ReferralPage.tsx` — ensure referral code shows, copy works, earnings display
6. Fix `WalletPage.tsx` — deposit/withdraw forms work, history shows
7. Fix `AccountPage.tsx` — profile shows, edit name works, bet history shows, logout works
8. Fix `AdminPage.tsx` — timer always runs, all controls work, data loads correctly
9. Validate build
