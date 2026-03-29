---
paths:
  - "src/**"
---

# Code Style Rules

1. **Never hardcode colors or spacing.** Always use CSS custom properties (`--tc-`, `--bc-`, `--sc-` for colors, `--spacing-*` / `--layout-*` for spacing).
2. **No dark mode.** Do not add `prefers-color-scheme` media queries.
3. **No shadows.** `box-shadow: none` everywhere.
4. **Typography hierarchy matters.** Titles at weight 400, body at weight 300. Never mix weights arbitrarily.
5. **Keep border-radius at 6px** (`var(--radius)`). Only use `border-radius: 50%` for pills, switches, and radio buttons.
6. **Page layout**: `--bc-3` background, `--layout-page` padding (12px), `--layout-section` gaps (8px) between sections.
7. **Buttons default to `type="button"`** to prevent accidental form submission.
8. **Disabled buttons**: `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none`.
9. **Icons inherit text color** via `fill="currentColor"`. Size them at 12 (sm), 16 (md), or 20 (lg).
10. **Focus states**: `border-color: var(--bc-highlight)` on inputs.
