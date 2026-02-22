---
paths:
  - "src/**"
---

# Code Style Rules

1. **Never hardcode colors or spacing.** Always use the design tokens (`tc-`, `bc-`, `sc-` prefixes for Tailwind classes).
2. **Use `cn()` for all className composition.** Import from the project utils.
3. **Use `forwardRef`** on all interactive/focusable components.
4. **Follow the variant/size pattern.** Use `Record<Variant, string>` maps for variant and size classes with sensible defaults.
5. **Always accept a `className` prop** and merge it last via `cn()` so consumers can override styles.
6. **Apply consistent focus rings** on every focusable element:
   ```
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-bc-1
   ```
7. **Apply consistent disabled styles**: buttons get `disabled:pointer-events-none`, form controls get `disabled:cursor-not-allowed disabled:opacity-50`.
8. **No dark mode.** Do not add dark-mode variants or `prefers-color-scheme` media queries.
9. **No shadows.** Shadows are set to `none`.
10. **Typography hierarchy matters.** Use title classes for headings/labels, body classes for content, subtitle/detail for secondary info. Never mix weights arbitrarily.
11. **Keep border-radius at 6px.** Use `rounded-sm` or `rounded-md` (both 6px). Only use `rounded-full` for pills, switches, and radio buttons.
12. **Page layout**: `bc-3` background, `layout-page` padding (12px), `layout-section` gaps (8px) between sections.
13. **Buttons default to `type="button"`** to prevent accidental form submission.
14. **Icons inherit text color** via `fill="currentColor"`. Size them at 12 (sm), 16 (md), or 20 (lg).
