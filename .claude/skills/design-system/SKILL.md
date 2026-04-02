---
name: design-system
description: >
  The Bridge UI design system based on even-toolkit design tokens.
  Use when building or styling UI components, working with CSS custom properties,
  color tokens, typography, spacing, or any frontend UI work.
---

# The Bridge — UI Design System Reference

Design tokens sourced from **even-toolkit** (`even-toolkit/web/theme-light.css`). The project uses vanilla CSS custom properties — no React, no Tailwind.

---

## Token Mapping

The project's CSS variables (defined in `src/public/index.html` `:root`) map to even-toolkit tokens:

### Text Colors

| Project Var          | even-toolkit Var          | Value     | Usage                    |
| -------------------- | ------------------------- | --------- | ------------------------ |
| `--tc-highlight`     | `--color-text-highlight`  | `#ffffff` | Text on dark backgrounds |
| `--tc-highlight-pressed` | —                     | `#e6e6e6` | Pressed state on dark bg |
| `--tc-1`             | `--color-text`            | `#232323` | Primary text             |
| `--tc-2`             | `--color-text-dim`        | `#7b7b7b` | Secondary/muted text     |
| `--tc-accent`        | `--color-accent`          | `#232323` | Accent text              |
| `--tc-red`           | `--color-negative`        | `#ff453a` | Error/destructive        |
| `--tc-red-muted`     | —                         | `#ff8f87` | Muted error              |
| `--tc-green`         | `--color-positive`        | `#4bb956` | Success                  |

### Background Colors

| Project Var          | even-toolkit Var          | Value     | Usage                    |
| -------------------- | ------------------------- | --------- | ------------------------ |
| `--bc-highlight`     | `--color-accent`          | `#232323` | Primary buttons, emphasis|
| `--bc-1`             | `--color-surface`         | `#ffffff` | Card/surface background  |
| `--bc-2`             | `--color-surface-light`   | `#f6f6f6` | Subtle background        |
| `--bc-3`             | `--color-bg`              | `#eeeeee` | Page background          |
| `--bc-4`             | `--color-border`          | `#e4e4e4` | Borders, dividers        |
| `--bc-accent`        | `--color-accent-warning`  | `#fef991` | Accent buttons           |
| `--bc-accent-pressed`| —                         | `#f2e47a` | Accent pressed state     |
| `--bc-accent-muted`  | —                         | `#fff7c2` | Subtle accent background |

### Shaded Colors

| Project Var | even-toolkit Var       | Value                    | Usage         |
| ----------- | ---------------------- | ------------------------ | ------------- |
| `--sc-1`    | `--color-overlay`      | `rgba(0, 0, 0, 0.5)`    | Overlay/scrim |
| `--sc-2`    | `--color-accent-alpha` | `rgba(35, 35, 35, 0.08)` | Subtle shadow |

---

## Typography

### Font

- **Family**: `"FK Grotesk Neue"`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`
- **CSS variable**: `--font-family-sans`
- **Letter spacing**: `-0.03em` on all text
- **Line height**: `normal`

### Type Scale

Titles use weight **400** (regular). Body text uses weight **300** (light).

| even-toolkit Class     | Size | Weight | Usage              |
| ---------------------- | ---- | ------ | ------------------ |
| `.text-vlarge-title`   | 24px | 400    | Extra large titles |
| `.text-large-title`    | 20px | 400    | Large titles       |
| `.text-medium-title`   | 17px | 400    | Primary titles     |
| `.text-medium-body`    | 17px | 300    | Primary body text  |
| `.text-normal-title`   | 15px | 400    | Secondary titles   |
| `.text-normal-body`    | 15px | 300    | Secondary body     |
| `.text-subtitle`       | 13px | 400    | Subtitles, labels  |
| `.text-detail`         | 11px | 400    | Fine print         |

Letter spacing per size: `-0.72px` (24), `-0.6px` (20), `-0.17px` (17), `-0.15px` (15), `-0.13px` (13), `-0.11px` (11).

---

## Spacing

| Var              | Value | Usage                |
| ---------------- | ----- | -------------------- |
| `--spacing-8`    | 8px   | Tight gaps           |
| `--spacing-12`   | 12px  | Default gaps         |
| `--spacing-16`   | 16px  | Card padding         |
| `--spacing-20`   | 20px  | Section margins      |
| `--spacing-24`   | 24px  | Large section gaps   |

### Layout

| Var                | even-toolkit Var          | Value | Usage          |
| ------------------ | ------------------------- | ----- | -------------- |
| `--layout-page`    | `--spacing-margin`        | 12px  | Page padding   |
| `--layout-section` | `--spacing-same`          | 8px → 6px | Section gaps |
| `--layout-card`    | `--spacing-card-margin`   | 16px  | Card margin    |

**Note:** even-toolkit uses `--spacing-same: 6px` and `--spacing-cross: 12px` where we use a flat 8px `--layout-section`. Keep our value for consistency.

---

## Borders & Radius

| Property      | Value | Notes                        |
| ------------- | ----- | ---------------------------- |
| Border width  | 1px   | Default for cards, inputs    |
| Border color  | `--bc-4` (`#e4e4e4`)        |                |
| Border radius | 6px   | `--radius` / `--radius-default` |

No shadows. `box-shadow: none` everywhere.

---

## Theme

**Light theme only.** No dark mode. No `prefers-color-scheme` media query.

even-toolkit provides a dark theme (`even-toolkit/web/theme-dark.css`) but we do not use it.

---

## Component Patterns

All components are vanilla HTML + CSS. No framework.

### Buttons

| Variant   | Background         | Text               | Pressed              |
| --------- | ------------------ | ------------------ | -------------------- |
| primary   | `--bc-highlight`   | `--tc-highlight`   | `--tc-1`             |
| default   | `--bc-1`           | `--tc-1`           | `--bc-3`             |
| accent    | `--bc-accent`      | `--tc-accent`      | `--bc-accent-pressed`|
| negative  | `--bc-1`           | `--tc-red`         | `--bc-3`             |

Standard button: `padding: var(--spacing-12) var(--spacing-16)`, `border-radius: var(--radius)`, `font-size: 17px`, `font-weight: 400`.

All buttons use `type="button"` to prevent accidental form submission.

### Cards

```css
background: var(--bc-1);
border: 1px solid var(--bc-4);
border-radius: var(--radius);
```

Content padding: `var(--spacing-12) var(--spacing-16)`.

### Form Controls (Input)

```css
padding: var(--spacing-8) var(--spacing-12);
border: 1px solid var(--bc-4);
border-radius: var(--radius);
background: var(--bc-2);
font-size: 15px;
font-weight: 300;
```

Focus: `border-color: var(--bc-highlight)`.

### List Items (clickable rows)

```css
display: flex;
align-items: center;
width: 100%;
padding: var(--spacing-12) var(--spacing-16);
margin-bottom: var(--layout-section);
border: 1px solid var(--bc-4);
border-radius: var(--radius);
background: var(--bc-1);
font-size: 17px;
font-weight: 300;
```

Active: `background: var(--bc-3)`.

### Status Indicators

- Success: `color: var(--tc-green)`
- Error: `color: var(--tc-red)`
- Muted: `color: var(--tc-2)`

### Chat Bubbles

- Outgoing: `background: var(--bc-accent-muted)`, `border-color: var(--bc-accent-pressed)`, right-aligned
- Incoming: `background: var(--bc-1)`, left-aligned
- Sender/time: `font-size: 11px`, `color: var(--tc-2)`

---

## Page Layout

```css
body {
  font-family: var(--font-family-sans);
  background: var(--bc-3);
  color: var(--tc-1);
  max-width: 480px;
  margin: 0 auto;
  padding: var(--layout-page);
  letter-spacing: -0.03em;
  line-height: normal;
}
```

---

## Utilities from even-toolkit

Available via `even-toolkit/web/utilities.css`:

- `.scrollbar-hide` — hides scrollbars cross-browser
- `.animate-pulse-dot` — pulsing status dot animation
- `.timer-ring-circle` — smooth SVG ring transition
- `@keyframes slideUp/slideDown` — bottom sheet animations
- `@keyframes fadeIn/fadeOut` — overlay transitions

---

## Rules

1. **Never hardcode colors or spacing** — always use CSS custom properties
2. **No dark mode** — light theme only
3. **No shadows** — `box-shadow: none`
4. **Border radius is always 6px** (`var(--radius)`)
5. **Typography hierarchy**: titles at weight 400, body at weight 300
6. **Icons inherit text color** via `fill="currentColor"`, sized 12/16/20px
7. **Disabled buttons**: `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none`
8. **Page background**: `--bc-3`, section gaps: `--layout-section` (8px)
