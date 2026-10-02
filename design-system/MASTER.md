# Pathshala design system (source of truth)

**Feel:** calm, focused study space — paper-like surfaces, moss green for action, ochre for "continue/next" accents. Not a generic productivity app or chatbot.

## Tokens (app/globals.css) — never use raw hex in components
- Surfaces: paper / surface / surface-raised. Text: ink, ink-soft, ink-faint (all ≥ 4.5:1 on every surface, light + dark).
- Action: moss + on-moss. Accent: ochre / ochre-soft. Dividers: line (decorative). Control borders: line-strong (≥ 3:1). Overlays: scrim.
- Dark theme follows the OS (`prefers-color-scheme`); every token is redefined there.

## Type
Source Serif 4 for titles and reading headings, Public Sans for UI. Reading text 17px / 1.75, measure ≤ 68ch, user-adjustable (A−/A+). Inputs are 16px (no mobile zoom).

## Interaction rules
- Every tappable thing ≥ 44×44px with ≥ 8px between targets; visible `:focus-visible` ring; press feedback ≤ 150ms; motion 150–300ms and honours reduced-motion.
- Icons: `components/Icons.tsx` only (SVG, 1.75 stroke). No emoji or text glyphs as icons.
- Status is never colour-only (ring / dot / check + screen-reader text).
- Overlays (contents drawer, assistant): `role="dialog"`, Escape closes, always an in-panel close button, scrim ≥ 40%.
- Switching sections resets scroll, moves focus to the content, and updates `?section=` so refresh/back are predictable.
