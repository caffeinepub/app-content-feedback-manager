# App Content & Feedback Manager — UI Refactor

## Current State

The app is a full-stack React + Motoko app with a dark-mode-first design using OKLCH color tokens, glassmorphism cards, and custom CSS classes (`.glass-card`, `.glass-input`, `.gradient-button`). It has light/dark mode toggle.

Key issues:
- **Single Comment Generator** (`UserView.tsx`): The `SelectTrigger` uses `bg-secondary` which maps to a dark background in dark mode, making selected text nearly unreadable. After selecting a list, the dropdown field becomes too dark with poor contrast.
- **SelectTrigger** hardcoded as `bg-secondary border-border` — in dark mode this is a very dark bg with dark text.
- Various inline OKLCH styles use very low-lightness backgrounds (e.g. `oklch(0.18 0.04 220 / 0.5)`) with small text.
- The app has a Google Fonts `@import` in `index.css` which fails in deployed environments (no external network access).
- Missing `gradient-text` utility class (used in App.tsx header logo).
- Missing `gradient-btn` CSS class (used in SingleGeneratorView and BulkGeneratorView).
- The `CountdownBanner` references `countdown-time` class which is not defined.

## Requested Changes (Diff)

### Add
- A `.gradient-btn` CSS utility class for the teal-to-green gradient button style used in generators.
- A `.gradient-text` CSS utility class for gradient text on the logo/headings.
- A `countdown-time` CSS class for the countdown banner time display.
- A `.select-field` CSS helper that forces `bg-white text-gray-900` in light mode and `bg-[oklch(0.18_0.03_260)] text-foreground` in dark mode, ensuring high contrast regardless of mode.
- `@font-face` declarations using local `/assets/fonts/` paths for Sora (body) and Bricolage Grotesque (headings) to replace the broken Google Fonts import.
- `animate-fade-in` keyframe/animation class (referenced in UserView but missing).

### Modify
- **`index.css`**: Remove the broken Google Fonts `@import`. Add `@font-face` declarations for self-hosted fonts. Add missing utility classes. Fix the dark-mode select/input background to never be pure black.
- **`tailwind.config.js`**: Register the new font families. Fix the `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` color tokens to use `oklch()` wrappers instead of `hsl()` (they currently use `hsl(var(--primary))` but the CSS variables are defined in OKLCH).
- **`UserView.tsx` — Single Comment Generator section**:
  - Fix `SelectTrigger` class: replace `bg-secondary border-border` with explicit light/dark safe classes that ensure white/light background and dark readable text.
  - Fix the generated comment box: use `bg-card border-border text-foreground` instead of raw OKLCH inline styles.
  - Fix the "no comments left" and "already claimed" notice boxes to use semantic token classes.
  - Fix the generate button to use the `.gradient-btn` class.
  - Fix the copy button inline styles to use token classes.
  - Increase all tap areas to `min-h-[48px]` on the generate button.
  - Add `space-y-5` spacing.
- **`BulkGeneratorView.tsx`**: Replace `gradient-btn` className (class doesn't exist) with the correct `.gradient-btn` utility or inline gradient style. Fix Input field `bg-muted/30` to use `bg-input` for proper contrast in both modes.
- **`SingleGeneratorView.tsx`**: Fix `gradient-btn` class usage — use the `.gradient-btn` utility. Ensure the generate button and cards use proper contrast tokens.
- **`App.tsx`**: Add `gradient-text` class for the logo text. Ensure the tab nav uses readable contrast in both light and dark modes.

### Remove
- The broken `@import url("https://fonts.googleapis.com/...")` line from `index.css`.
- Any inline `bg-black` or near-black (`oklch(0.08...)`) on input/select trigger elements.

## Implementation Plan

1. Fix `index.css`:
   - Remove Google Fonts import.
   - Add `@font-face` for Sora (body) and Bricolage Grotesque (display/heading) from `/assets/fonts/`.
   - Add missing utility classes: `.gradient-btn`, `.gradient-text`, `.countdown-time`, `.animate-fade-in`.
   - Add `.select-trigger-field` class for the dropdown trigger that enforces white bg + dark text in light mode, slightly elevated bg + light text in dark mode.
   - Fix `.glass-input` so it never uses near-black in light mode.

2. Fix `tailwind.config.js`:
   - Update font families to use Sora and Bricolage Grotesque.
   - Fix color token mappings to use `oklch()` wrapper format consistently.

3. Fix `UserView.tsx` — Single Comment Generator:
   - Replace `<SelectTrigger className="w-full bg-secondary border-border">` with classes that ensure readable contrast: `w-full bg-card text-card-foreground border-border font-medium shadow-sm focus:ring-2 focus:ring-teal-400/50`.
   - Replace inline OKLCH styles on status notices with semantic token classes.
   - Update generate button to use `.gradient-btn` and ensure `min-h-[48px]`.
   - Update generated comment box to use `bg-card border-border text-foreground`.

4. Fix `BulkGeneratorView.tsx`:
   - Fix `className="gradient-btn"` on Button to use the actual gradient styles via CSS class.
   - Fix Input field to have proper contrast.

5. Fix `SingleGeneratorView.tsx`:
   - Fix `gradient-btn` Button className.
   - Ensure pool stats cards have readable text.

6. Fix `App.tsx`:
   - Add `gradient-text` to logo span.
   - Ensure tab nav buttons have proper contrast in light mode.

7. Audit `LiveChecker.tsx` for contrast issues — fix any dark-on-dark text problems in light mode by switching raw OKLCH inline styles to semantic token classes where possible.

8. Run `frontend_validate` to confirm typecheck, lint, and build pass.
