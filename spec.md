# Winverse

## Current State
Backend has randomMode and manual result per round. Result in triggerRoundResult.

## Requested Changes (Diff)

### Add
- lowestBetWinsMode stable bool in backend
- setLowestBetWinsMode / getLowestBetWinsMode functions
- Internal function: lowest-bet option with random tiebreak
- Admin panel ON/OFF toggle

### Modify
- triggerRoundResult: if lowestBetWinsMode=true, override with lowest-bet result
- Admin panel: toggle + gray out manual controls when ON

### Remove
- Nothing

## Implementation Plan
1. Backend: stable var, public functions, calculation logic, update triggerRoundResult
2. Frontend: toggle in Game Control tab, disable manual controls when mode is ON
