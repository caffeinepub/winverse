# Winverse — Full ICP Canister Integration Fix

## Current State

The Motoko backend (`src/backend/main.mo`) has all required features implemented with `stable var` persistence:
- User signup/login with ₹200 bonus
- Referral system (unlimited chain)
- Betting with 30-second rounds
- Deposit/withdrawal requests
- Admin panel: ban/unban, betting distribution, manual/random/lowest-bet-wins modes
- Round counter reset at 1000

However, the frontend `src/frontend/src/lib/backend.ts` is a **completely localStorage-based mock** that NEVER calls the ICP canister. This means:
- Every user's data is siloed on their own device
- Admin panel shows only data from the admin's own localStorage
- Referral chains don't sync across devices
- Data is lost when browser storage is cleared

The `src/frontend/src/backend.ts` (auto-generated actor) has an empty `_SERVICE {}` interface — the canister bindings were never generated properly.

## Requested Changes (Diff)

### Add
- Proper ICP canister method bindings via `generate_motoko_code`
- Real canister-calling implementation in `lib/backend.ts` using the generated actor
- `useActor` hook usage for all canister calls

### Modify
- `src/frontend/src/lib/backend.ts`: Replace entire localStorage mock with real ICP canister calls
- All pages (AuthPage, HomePage, ReferralPage, WalletPage, AccountPage, AdminPage): ensure they use the shared canister backend
- `src/backend/main.mo`: Regenerate with all features to produce proper TypeScript bindings

### Remove
- localStorage-based data storage from backend.ts
- All mock DB logic

## Implementation Plan

1. Regenerate Motoko backend (same features) to produce correct TypeScript bindings
2. Rewrite `lib/backend.ts` to call the canister actor directly
3. Ensure all pages import from `lib/backend.ts` (already done)
4. Fix any TypeScript type mismatches between canister return types and frontend expectations
5. Validate + deploy
