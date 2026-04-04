# Review Empire

## Current State
- Version 97 codebase is present and complete
- All features live: comment generators, bulk checker, withdrawal system, admin panel (code 7898), Neon Gems game (Arcade + Zen Zone), live checker, music system, batch upload, receipt generator, day/night mode, dragon background, 6-comment device limit
- Backend has: `setEarningsMode`, `getSingleCheckerEarningsEnabled`, `getBulkCheckerEarningsEnabled`, `setSingleCheckerEarningsEnabled`, `setBulkCheckerEarningsEnabled`, all withdrawal/earnings functions
- AdminSettings.tsx has: Access Key, Background Music, Spotify, WhatsApp, Per Link Rate, Earnings Mode A/B, Checker Earnings On/Off toggles, Danger Zone
- SingleGeneratorView.tsx: simple generate button using `useGenerateSingle` hook — no admin force/max limit controls yet
- Last deployment failed (transient error, no code changes needed)

## Requested Changes (Diff)

### Add
- Admin Settings: "Comment Generation Controls" card with:
  - Force Count toggle (ON/OFF) + input for fixed count (when ON, user input is overridden)
  - Max Limit input (cap user requests at this number; 0 = no limit)
  - Both stored in localStorage under keys `adminForceCountEnabled`, `adminForceCount`, `adminMaxLimit`
  - Save button with SAVING... state
- SingleGeneratorView: read `adminForceCountEnabled`, `adminForceCount`, `adminMaxLimit` from localStorage to apply controls
  - When force enabled: show gold badge "Admin: Force X comments" and ignore user input
  - When max limit set: cap user input; show cyan badge "Max: X per request"

### Modify
- SingleGeneratorView: add a numeric count input (1–20) so users can request multiple comments at once from the list selector (currently only generates 1 at a time from global pool). Apply admin force/max logic to this count field.
- AdminSettings.tsx: add the new Comment Generation Controls card between Checker Earnings Visibility and Danger Zone

### Remove
- Nothing

## Implementation Plan
1. Add `adminForceCountEnabled` (bool), `adminForceCount` (number), `adminMaxLimit` (number) state to AdminSettings.tsx with localStorage persistence
2. Add Comment Generation Controls UI card in AdminSettings.tsx with toggle + two number inputs + save button
3. Update SingleGeneratorView.tsx to read these localStorage values and apply force/max logic to count field
4. Ensure all existing features remain intact — no regressions
5. Validate (typecheck + lint + build)
