# Review Empire — Cinematic Dark Command Center Reskin

## Current State
Full-stack ICP app with Motoko backend and React frontend. Gold/navy luxury theme with Syne font, ParticleConstellation background, gold iridescent HeroCube (Three.js), TOOLS→GAME→LOBBY tab layout, hidden admin panel (code 7898), all functional features (comment generators, bulk checker, withdrawal system, earnings engine Mode A/B, Neon Jewel Blast + Zen Zone, music system, receipt generator, Mission Briefing popup).

## Requested Changes (Diff)

### Add
- Cinematic boot sequence (sessionStorage-gated, plays once per session): black screen → "R" then "E" stamp with CSS metallic animation → thin silver progress bar → staggered UI reveal 200ms apart
- Floating geometric runes (◆ ▲ ⬡ ◇ △ ▽) rising from bottom, rotating, dissolving — replaces particle constellation
- Drifting silver CSS grid overlay on `#050508` background
- Floating multifaceted diamond gem (SVG triangular panels in silver/ash/near-white shades) with zero-gravity hover+tilt, two elliptical orbit rings at different angles each with one glowing dot racing around
- Color Switcher: 6 gem-shaped swatches (Silver, Gold, Electric Cyan, Blood Rose, Toxic Lime, Deep Violet) — one tap repaints entire universe: grid glow, gem panels, orbit rings, card borders, button gradients, nav dots, underline glows. Active swatch = white ring + scale pop.
- Day progress bar in countdown card: liquid silver fill showing how much of today is gone
- Boot sequence: each section drops in from slightly above with fade, 200ms stagger

### Modify
- Background: `#050508` pure black void (from `#080C1A` navy)
- Fonts: Orbitron 900 (headings/buttons), Share Tech Mono (clock/input/data labels), Rajdhani (body) — load from Google Fonts
- HeroCube → replaced by the diamond gem SVG in hero section
- Access code input: dark glass, silver neon border ignites on focus with sonar pulse, placeholder "ENTER ACCESS CODE" in monospace
- ACCESS ADMIN button: gunmetal gradient, white light sweep left-to-right on hover
- Nav tabs (TOOLS/GAME/LOBBY): dark glass tiles with colored status dots; hover = center-outward glowing underline + lift
- LOBBY tab: full width, slightly taller, frosted look
- Countdown card: frosted obsidian panel, razor-thin silver top edge, monospaced digits with heartbeat pulse, added day progress bar
- Timer digits: huge, monospaced, silver-white with heartbeat glow every second
- All card borders, glows, and accents: respond to active theme color from Color Switcher
- ParticleConstellation component → replaced with RuneBackground component
- HeroCube component → replaced with DiamondGem component

### Remove
- Syne font (replaced by Orbitron)
- Gold particle constellation background (replaced by rune/grid background)
- Gold iridescent cube (replaced by diamond gem)
- F5C842 electric gold as fixed primary (now dynamic via Color Switcher, default = Silver theme)

## Implementation Plan
1. Add Google Fonts: Orbitron, Share Tech Mono, Rajdhani to index.html
2. Create BootSequence component (sessionStorage gate, "RE" stamp, progress bar, reveal)
3. Create RuneBackground component (CSS grid overlay + floating rune symbols)
4. Create DiamondGem component (SVG multi-panel diamond, orbit rings with racing dots, hover tilt)
5. Create ThemeSwitcher component (6 gem swatches, CSS custom properties for theme colors)
6. Update App.tsx: wrap in ThemeProvider, inject CSS vars, add BootSequence, replace ParticleConstellation with RuneBackground, replace HeroCube with DiamondGem
7. Update hero section: access input with sonar pulse focus, gunmetal ACCESS ADMIN button with light sweep
8. Update nav: dark glass tiles, colored dots, center-out underline hover, LOBBY full-width
9. Update countdown card: frosted obsidian, razor edge, heartbeat digits, day progress bar
10. Update global CSS: apply theme CSS vars to all cards, borders, glows, buttons
11. Ensure all existing functionality unchanged (generators, withdrawal, admin, game, music)
