# Review Empire

## Current State

The app is a premium multi-sector web app with:
- 4-sector nav: TOOLS (default), GAME, LOBBY, ADMIN (hidden)
- Dragon Three.js WebGL background (night mode only currently)
- Cinematic boot sequence (sessionStorage gated)
- Admin panel (code: 7898, session-based unlock)
- All data in Motoko backend canister
- `liveListParser.ts` parses pasted text for bulk live list import
  - Current parser expects `*AppName*` and `*DD/MM/YYYY :-*` format (asterisk-wrapped)
  - Does NOT handle `Share post :- MM/DD/YY` date format or plain company name lines
- `AdminPricing.tsx` handles price list with bulk CSV upload (AppName, Price, Active)
- `DragonBackground.tsx` is the single background component (always night/dark)
- `App.tsx` renders DragonBackground unconditionally

## Requested Changes (Diff)

### Add
- **`DayBackground.tsx`**: New Three.js day scene component:
  - Bright blue sky (gradient from #87CEEB to #E0F4FF)
  - 3 layered mountain silhouettes (deep green, mid green, light)
  - Dense dark forest at bottom (instanced pine trees with wind sway)
  - Brown/earth land strip at very bottom
  - Same dragon as night but bright/natural (no fire glow, ember cracks dim)
  - Animated colorful butterflies (CSS-based, 6+ different colors, flutter paths)
  - Warm sunlight DirectionalLight from upper-right
  - No fog, no aurora — bright open sky
- **`DayNightToggle.tsx`**: Floating toggle button:
  - Shows sun/moon icon
  - Manual override tap
  - Displays current mode label
- **Day theme CSS variables** in `index.css` under `.day-mode` class:
  - `--bg-primary: #f0f9ff` (light cream-blue)
  - `--card-bg: rgba(255,255,255,0.7)`
  - `--card-border: rgba(100,180,120,0.3)` (soft green)
  - `--text-primary: #1a2a1a` (dark green-black)
  - `--text-secondary: #3a5a3a`
  - `--accent: #2a7a2a` (forest green)
  - Buttons use green gradient instead of gold/navy

### Modify
- **`src/frontend/src/utils/liveListParser.ts`**: Complete rewrite of parser:
  - Support new format: first non-empty line = app/company name (strip trailing colon)
  - Date detection regex: `Share post :-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})` (no asterisks)
  - Keep backward compatibility: also detect `*DD/MM/YYYY :-*` format
  - Name lines: numbered `1. Name`, `2. Name` — strip number prefix
  - Skip lines that are purely special chars or empty after trim
  - Build entries per date: each date gets its own `ParsedAppEntry` with that date
  - Same app can appear multiple times (one entry per date section)
  - Deduplication key: `appName + '|' + username + '|' + date` — skip exact duplicates silently
  - Handle 1000+ names: no break conditions, full linear scan
  - Handle lines like `#123 #123` — include as-is (valid username)
  - After parsing, `importLiveLists` backend call already deduplicates by (appName, username, date)
- **`src/frontend/src/App.tsx`**: Add day/night mode logic:
  - `isDayMode` state: auto-computed from `new Date().getHours()` (6–18 = day)
  - `manualOverride` state: if user taps toggle, override auto
  - Render `<DayBackground />` when day mode, `<DragonBackground />` when night
  - Apply `day-mode` class to root `<div>` when day mode active
  - Render `<DayNightToggle />` in fixed position (bottom-right, above footer)
  - Pass `isDayMode` to child components that need theme awareness (cards, buttons)

### Remove
- Nothing removed

## Implementation Plan

1. **Rewrite `liveListParser.ts`**:
   - New regex: `Share post :-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})`
   - App name = first non-empty, non-date, non-numbered line (strip trailing `:` or `:-`)
   - Group names under each detected date
   - One `ParsedAppEntry` per (appName, date) pair
   - Full dedup set to avoid sending duplicates to backend
   - No limits — process all lines regardless of count

2. **Create `DayBackground.tsx`**:
   - Three.js canvas fixed behind all content
   - Bright sky, layered mountains, forest, brown land
   - Dragon reuse from DragonBackground logic (simplified, no fire, no dark shader)
   - CSS butterfly animations (6+ butterflies, random positions/timing)

3. **Create `DayNightToggle.tsx`**:
   - Fixed bottom-right button with sun/moon icon
   - Callback to toggle manual override in App.tsx

4. **Add day theme CSS** in `index.css`:
   - `.day-mode` overrides for cards, nav, buttons, text, backgrounds
   - Smooth `transition: all 0.6s ease` on root for mode switch

5. **Update `App.tsx`**:
   - Add `isDayMode` computed state with auto + manual override
   - Switch background component based on mode
   - Add `day-mode` class to root div
   - Place toggle button
