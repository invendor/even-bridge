# Even Bridge — UI Design System Reference

This document defines the UI rules, tokens, and patterns for this project. All components must follow these guidelines. The design system is based on the Even Realities UI library.

## Framework & Tooling

- **React 19** functional components
- **Tailwind CSS** for all styling (utility-first, no CSS modules, no CSS-in-JS)
- **clsx + tailwind-merge** via a `cn()` utility for className composition
- Every component accepts a `className` prop merged through `cn()`
- All interactive components use `React.forwardRef`

## Theme

Light theme only. No dark mode. No `prefers-color-scheme` media query.

## Color Tokens

All colors are CSS custom properties mapped to Tailwind classes. Never hardcode raw hex values — always use the token.

### Text Colors (`tc-`)

| Token              | Value     | Tailwind Class            | Usage                      |
| ------------------- | --------- | ------------------------- | -------------------------- |
| `tc-highlight`      | `#ffffff` | `text-tc-highlight`       | Text on dark backgrounds   |
| `tc-highlight-pressed` | `#e6e6e6` | `text-tc-highlight-pressed` | Pressed state on dark bg |
| `tc-1`              | `#232323` | `text-tc-1`               | Primary text               |
| `tc-2`              | `#7b7b7b` | `text-tc-2`               | Secondary/muted text       |
| `tc-accent`         | `#232323` | `text-tc-accent`          | Accent text                |
| `tc-red`            | `#ff453a` | `text-tc-red`             | Error/destructive text     |
| `tc-red-muted`      | `#ff8f87` | `text-tc-red-muted`       | Muted error text           |
| `tc-green`          | `#4bb956` | `text-tc-green`           | Success text               |

### Background Colors (`bc-`)

| Token               | Value                  | Tailwind Class          | Usage                        |
| -------------------- | ---------------------- | ----------------------- | ---------------------------- |
| `bc-highlight`       | `#232323`              | `bg-bc-highlight`       | Primary buttons, emphasis    |
| `bc-1`               | `#ffffff`              | `bg-bc-1`               | Card/surface background      |
| `bc-2`               | `#f6f6f6`              | `bg-bc-2`               | Subtle background            |
| `bc-3`               | `#eeeeee`              | `bg-bc-3`               | Page background, dividers    |
| `bc-4`               | `#e4e4e4`              | `bg-bc-4`               | Borders, heavier dividers    |
| `bc-accent`          | `#fef991`              | `bg-bc-accent`          | Accent buttons               |
| `bc-accent-pressed`  | `#f2e47a`              | `bg-bc-accent-pressed`  | Accent pressed state         |
| `bc-accent-muted`    | `#fff7c2`              | `bg-bc-accent-muted`    | Subtle accent background     |

### Shaded Colors (`sc-`)

| Token  | Value                  | Usage            |
| ------ | ---------------------- | ---------------- |
| `sc-1` | `rgba(0, 0, 0, 0.5)`  | Overlay/scrim    |
| `sc-2` | `rgba(35, 35, 35, 0.08)` | Subtle shadow |

## Typography

### Font

- **Family**: `"FK Grotesk Neue"`, falling back to `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **CSS variable**: `--font-family-sans`
- **Letter spacing**: `-0.03em` on all text
- **Line height**: `normal`

### Type Scale

Titles use weight **400** (regular). Body text uses weight **300** (light).

| Tailwind Class       | Size  | Weight | Usage              |
| -------------------- | ----- | ------ | ------------------ |
| `text-app-title-xl`  | 24px  | 400    | Extra large titles |
| `text-app-title-lg`  | 20px  | 400    | Large titles       |
| `text-app-title-1`   | 17px  | 400    | Primary titles     |
| `text-app-body-1`    | 17px  | 300    | Primary body text  |
| `text-app-title-2`   | 15px  | 400    | Secondary titles   |
| `text-app-body-2`    | 15px  | 300    | Secondary body     |
| `text-app-subtitle`  | 13px  | 400    | Subtitles          |
| `text-app-detail`    | 11px  | 400    | Fine print         |

## Spacing

Custom spacing scale mapped to CSS variables. Use these as Tailwind spacing values (e.g. `p-16`, `gap-12`, `mt-24`).

| Token | Value |
| ----- | ----- |
| `0`   | 0px   |
| `8`   | 8px   |
| `12`  | 12px  |
| `16`  | 16px  |
| `20`  | 20px  |
| `24`  | 24px  |
| `28`  | 28px  |
| `32`  | 32px  |

### Layout Spacing

| Token            | Value | Usage                |
| ---------------- | ----- | -------------------- |
| `layout-page`    | 12px  | Page padding         |
| `layout-section` | 8px   | Gap between sections |
| `layout-card`    | 16px  | Card margin          |

## Borders & Radius

| Token        | Value | Tailwind        |
| ------------ | ----- | --------------- |
| Border 1     | 1px   | `border` / `border-1` |
| Border 2     | 2px   | `border-2`      |
| Radius small | 6px   | `rounded-sm`    |
| Radius medium| 6px   | `rounded-md`    |

Shadows are `none`.

## Component Patterns

### Button

Four variants, three sizes.

**Variants:**

| Variant    | Background        | Text              | Pressed                |
| ---------- | ----------------- | ----------------- | ---------------------- |
| `default`  | `bg-bc-1` (white) | `text-tc-1`       | `bg-bc-3`              |
| `accent`   | `bg-bc-accent`    | `text-tc-1`       | `bg-bc-accent-pressed` |
| `primary`  | `bg-bc-highlight` | `text-tc-highlight` | —                    |
| `negative` | `bg-bc-1`         | `text-tc-red`     | —                      |

**Sizes:**

| Size | Height | Horizontal padding |
| ---- | ------ | ------------------ |
| `sm` | 28px   | 12px               |
| `md` | 32px   | 16px               |
| `lg` | 40px   | 20px               |

### IconButton

Same variant and size system as Button, but square (equal width and height).

### Card

- `rounded-md`, `border-bc-4`, `bg-bc-1`, `shadow-1`
- **CardHeader / CardFooter**: separated by `border-b` / `border-t` with `border-bc-3`
- **CardContent**: `px-16 py-12`

### Form Controls (Input, Textarea, Select)

- Height: 32px (`min-h-32` for Textarea)
- `rounded-sm`, `border-bc-4`, `bg-bc-1`
- Placeholder color: `text-tc-2`
- Focus: `focus-visible:ring-2 ring-bc-highlight ring-offset-2 ring-offset-bc-1`

### Checkbox & Radio

- Size: 16x16
- `rounded-sm` (Checkbox), `rounded-full` (Radio)
- Accent: `accent-bc-highlight`
- Label: `text-app-body-2`, description: `text-app-detail text-tc-2`

### Switch

- Track: 32x20, `rounded-full`
- Unchecked: `bg-bc-3`, checked: `bg-bc-highlight`
- Thumb: 16x16, `rounded-full`, `bg-bc-1`, translates 12px right when checked

### Chip

| Size | Padding      | Text class         |
| ---- | ------------ | ------------------ |
| `sm` | `px-12 py-4` | `text-app-detail`  |
| `lg` | `px-16 py-8` | `text-app-body-2`  |

- `rounded-sm`, `border-bc-3`, `bg-bc-2`

### Badge

- `rounded-sm`, `border-bc-3`, `bg-bc-2`, `text-app-detail`

### Text

Polymorphic component (`as` prop, defaults to `<span>`). Pass `variant` to select the type scale class. Default color: `text-tc-1`.

### Divider

`<hr>` with `border-bc-3`.

## Interaction States

### Focus

All focusable elements:
```
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-bc-highlight
focus-visible:ring-offset-2
focus-visible:ring-offset-bc-1
```

### Disabled

- Buttons: `disabled:pointer-events-none`
- Form controls: `disabled:cursor-not-allowed disabled:opacity-50`
- Text in disabled state: `disabled:text-tc-2`

## Body Defaults

```css
body {
  font-family: var(--font-family-sans);
  background-color: var(--color-bc-3); /* #eeeeee */
  padding: var(--layout-page-padding);  /* 12px */
}
```

## Rules for AI Agents

1. **Never hardcode colors or spacing.** Always use the design tokens defined above.
2. **Use `cn()` for all className composition.** Import from the project utils.
3. **Use `forwardRef`** on all interactive/focusable components.
4. **Follow the variant/size pattern.** Use `Record<Variant, string>` maps for variant and size classes with sensible defaults.
5. **Always accept a `className` prop** and merge it last via `cn()` so consumers can override styles.
6. **Apply consistent focus rings** using the focus pattern above on every focusable element.
7. **Apply consistent disabled styles** as described above.
8. **No dark mode.** Do not add dark-mode variants or media queries.
9. **No shadows.** Shadows are set to `none`.
10. **Typography hierarchy matters.** Use title classes for headings and labels, body classes for content, subtitle/detail for secondary information. Never mix weights arbitrarily.
11. **Keep border-radius at 6px.** Use `rounded-sm` or `rounded-md` (both 6px). Only use `rounded-full` for pills, switches, and radio buttons.
12. **Page layout**: `bc-3` background, `layout-page` padding (12px), `layout-section` gaps (8px) between sections.
13. **Buttons default to `type="button"`** to prevent accidental form submission.
14. **Icons inherit text color** via `fill="currentColor"`. Size them at 12 (sm), 16 (md), or 20 (lg).
