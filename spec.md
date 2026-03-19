# Neon Empire — Final Console Build

## Current State
App has 4-sector layout (TOOLS, LOBBY, GAME, ADMIN hidden). Tab order is TOOLS → LOBBY → GAME. SingleGeneratorView and BulkGeneratorView have no Mission Briefing popup after comment generation. AdminPricing form does not show projected total amount when entering a price.

## Requested Changes (Diff)

### Add
- Mission Briefing popup (Red Neon glassmorphism modal) triggered immediately after any comment is generated (single or bulk)
- 10-second countdown inside the 'I UNDERSTAND THE MISSION' button: shows 'READING MISSION... Xs' while disabled/greyed, then turns Cyan and becomes clickable
- Total amount calculation in AdminPricing: when viewing price entries, show projected total (price × entry count from pool stats). Also show live total preview when adding/editing a price.

### Modify
- Tab order in App.tsx nav: TOOLS (green) → GAME (yellow) → LOBBY (blue). Default active sector changes to 'tools'.
- AdminPricing: add 'Total' column showing price × entries count per app, and a grand total row
- AdminEarnings: verify total earnings calculation is displayed correctly with proper ₹ formatting

### Remove
- Nothing removed

## Implementation Plan
1. App.tsx: Reorder nav pills array to [TOOLS, GAME, LOBBY]; set default activeSector to 'tools' if not already.
2. Create MissionBriefingModal.tsx component — Red Neon glassmorphism modal with instructions list and 10s countdown button.
3. SingleGeneratorView.tsx: import and show MissionBriefingModal after successful generation.
4. BulkGeneratorView.tsx: import and show MissionBriefingModal after successful bulk generation.
5. AdminPricing.tsx: Add total projected earnings column using price × count from useGetPoolStats or per-app event counts; show grand total footer row.
