# Review Empire — Neon Empire 4-Sector Console Rebuild

## Current State
- 3 vertical pill nav tabs: USER VIEW, VIEW (Bottle Shooter), UPLOAD, LIVE/CHECKER
- Inline Admin Access code field in hero lobby
- Permanent hero lobby: 3D iridescent cube + cream countdown card
- Global VFX: starfield particles, scanlines, mouse-follow glow
- Navy neon theme (#02040F background, #00FFFF accents)
- Global Score/Rank HUD (top-right)
- Bottle Shooter 3D game (Three.js) in VIEW tab
- Spotify sticky player, music playback
- Footer: GAME MASTER: NISHANT CHAUDHARY + WhatsApp
- Backend: Motoko canister with all comment, list, earnings, music, admin APIs

## Requested Changes (Diff)

### Add
- Full-screen WebGL Fluid Simulation background (canvas layer behind all content)
  - Reacts to mouse/touch: color splashes + vortex on click, flowing tails on drag
  - Colors: Cyan, Magenta, Yellow, Red (matching 4 sector colors)
  - Slow dissipation, high density/velocity for premium liquid look
  - Paused when not interacting (battery saver)
- Stealth Mode toggle: fixed top-left corner, Moon/Radar icon
  - Neon Mode: vibrant multi-colored fluid
  - Stealth Mode: dark grey/navy smoke fluid at 20% opacity
- 4 Sector Tabs: LOBBY (blue), GAME (yellow), TOOLS (green), ADMIN (red, hidden/revealed via code)
- Neon Jewel Blast mini-game (10×10 grid) in GAME sector
  - Match-3 / jewel blast mechanics with neon gem colors
  - Score system integrated with localStorage global score
- TOOLS sector with sub-tabs: Comment Generators (first) + Live List/Bulk Checker (second)

### Modify
- Navigation: replace 3-pill stack with 4 horizontal sector tabs (LOBBY, GAME, TOOLS, ADMIN-hidden)
  - LOBBY tab = blue accent, GAME tab = yellow/gold accent, TOOLS tab = emerald green, ADMIN = red (only visible when unlocked)
- LOBBY sector: hero cube + countdown card + Spotify + earnings remain here
- TOOLS sector: consolidates existing UserView (comment generators) + UsernameChecker + LiveListView
- Remove Bottle Shooter 3D game, replace with Neon Jewel Blast in GAME sector
- All typography globally Bold Italic
- Enforce 120px vertical gaps between all sections
- Stealth mode replaces old theme toggle (dark/light toggle removed, stealth is now the toggle)
- Remove old Score/Rank HUD from top-right (score tracked via game internally)

### Remove
- BottleShooter3D component
- Old 3-pill vertical navigation
- Dark/Light theme toggle button from header (replaced by stealth mode toggle top-left)
- Global Score/Rank HUD overlay

## Implementation Plan
1. Create FluidSimulation component (WebGL canvas, Navier-Stokes fluid sim, touch/mouse interaction)
2. Create StealthModeToggle component (fixed top-left, moon icon, toggles fluid opacity/colors)
3. Create NeonJewelBlast component (10×10 grid, match-3 mechanics, score system)
4. Rebuild App.tsx with 4-sector tab structure (LOBBY, GAME, TOOLS, ADMIN)
5. Create TOOLS sector layout with sub-tabs: Generators | Checker
6. Update global CSS: bold italic typography everywhere, 120px section gaps, sector color variables
7. Remove BottleShooter3D, old pill nav, old HUD
8. Wire stealth mode state to FluidSimulation
9. Keep all existing views (UserView, UploadView, LiveListView, UsernameCheckerView, AdminView) intact
10. Validate and fix any TypeScript/lint errors
