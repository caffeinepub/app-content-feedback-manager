# Review Empire — Gold/Luxury Visual Reskin

## Current State
- Full app with 4-sector console (TOOLS, GAME, LOBBY, ADMIN)
- Navy/cyan neon theme: background #02040F, cyan #00AAFF/00FFFF accents
- WebGL FluidSimulation component as background
- Fonts: Outfit, Inter, Geist Mono via tailwind config
- HeroCube with blue/purple iridescent shader
- All tools functional: generators, bulk checker, withdrawal, admin panel
- Stealth mode toggle (top-left)
- Music player, Spotify integration
- Neon Jewel Blast + Zen Zone games
- Mission Briefing Modal after comment generation

## Requested Changes (Diff)

### Add
- Syne (900 weight) font for all headings via Google Fonts in index.html
- DM Sans font for subheadings via Google Fonts
- Gold particle constellation canvas component (mouse-reactive, replaces fluid sim)
- Gold shimmer keyframe animation in tailwind/index.css
- Gold neon box-shadow tokens in tailwind config
- Custom gold cursor dot (small gold circle, scales on hover)
- Card 3D tilt effect on hover (CSS perspective transform 3-5deg)

### Modify
- Background: #080C1A (deep navy, slightly warmer than current #02040F)
- Primary accent: Electric gold #F5C842 replacing cyan #00AAFF for buttons, nav borders, glows, HUD
- Secondary accent: Royal blue #2D6FF7 for secondary elements
- All sector nav tab colors: gold for active/hover instead of sector-specific colors
- HeroCube shader: gold iridescent (warm gold/amber tones) instead of blue/purple
- Header/nav: gold border accents instead of cyan
- Cards: glassmorphic with border rgba(255,215,0,0.12), gold glow on hover, 3D tilt
- Buttons: gold filled primary (#F5C842 bg, dark text), ghost gold outline secondary
- Button hover: shimmer sweep animation + scale(1.03)
- Scroll-triggered element animations: slide up + fade in
- Footer: gold separator line, maintain GAME MASTER: NISHANT CHAUDHARY
- index.css: update CSS variables for gold theme
- tailwind.config.js: add gold color tokens, Syne/DM Sans fonts, gold shadow tokens
- StealthModeToggle: gold icon instead of cyan
- Timer card in hero: maintain cream/gold (already correct)
- Particle background: replace FluidSimulation with ParticleConstellation (gold dots, mouse-reactive lines)

### Remove
- Cyan/neon blue as primary accent color throughout
- WebGL fluid simulation (replaced by particle constellation for performance)

## Implementation Plan
1. Update index.html to load Syne + DM Sans from Google Fonts
2. Update tailwind.config.js: add Syne/DM Sans fonts, gold color tokens (#F5C842), gold shadow utilities
3. Update index.css: retheme CSS variables, add shimmer/tilt/particle keyframes, custom gold cursor
4. Create ParticleConstellation.tsx: canvas-based gold particle system, mouse-reactive, replaces FluidSimulation
5. Update App.tsx: swap FluidSimulation → ParticleConstellation, update all inline colors from cyan to gold, update sector color map
6. Update HeroCube.tsx: gold iridescent shader
7. Update StealthModeToggle.tsx: gold icon
8. Apply card tilt + gold glow to all major card containers in views
9. Validate build passes
