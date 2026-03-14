# Review Empire — Archery King VIEW Tab + Global Footer

## Current State
- VIEW tab renders `ArcheryGame3D` component with a basic dark 3D scene (dark floor, cyan grid, torus rings target, minimal lighting)
- No VS Mode overlay — only a solo score/timer HUD
- Title inside the component says "3D PRECISION ARCHERY SIMULATOR"
- App footer is a minimal one-line copyright notice
- Header is sticky with "TIME UNTIL MIDNIGHT" countdown — untouched

## Requested Changes (Diff)

### Add
- **Realistic 3D stadium scene** inside `ArcheryGame3D`: skybox (blue sky + procedural clouds), green grass ground plane, stadium floodlight pole models, FITA targets at 3 distances on wooden backstops
- **VS Mode CSS overlay** on top of the Three.js canvas:
  - Left card: P1 label, player name (from localStorage or default "TERRY"), live score
  - Center: bold italic **X** graphic
  - Right card: P2 label, "AI OPPONENT" / "JENNIFER", live AI score
  - Scores update in real-time
- **AI Opponent score**: auto-scores at random intervals during active game
- **Global footer** in `App.tsx`:
  - `***GAME MASTER: NISHANT CHAUDHARY***` — bold italic, `#00FFFF`
  - Community paragraph text
  - WhatsApp CTA button linking to `https://chat.whatsapp.com/JZ5w3hyx4gYDtPWx91Xena`

### Modify
- Title → **"PRECISION ARCHERY PRO 3D"**
- Scene: sky blue background, green grass ground, warm sunlight lighting
- Remove dark fog, cyan grid, PRO MODE ACTIVE banner

### Remove
- Grid helper, PRO MODE ACTIVE banner, dark atmospheric fog
