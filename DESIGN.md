# Design System — Single Source of Truth

> **Canonical implementation:** `frontend/src/styles/tokens.css`.
> This document describes that file. If they ever disagree, `tokens.css` wins and this doc must be updated.
> The older systems (`design-system/tokens.json` with cyan `#6DD7FD`, and the previous version of this file with blue `#3B82F6`) are **deprecated** — do not take values from them.

## 1. Design Philosophy

- **Focus-first**: this product exists to boost academics, brainpower, and skills. The UI stays calm and quiet so content and progress are the loudest things on screen.
- **Consistency**: every color, size, and radius comes from a token. No hardcoded hex values in component CSS.
- **Both themes always**: light and dark are first-class; a color only exists as a token pair. Anything hardcoded breaks dark mode.
- **Accessibility**: WCAG 2.1 AA contrast; 48px minimum touch targets (enforced globally in `globals.css`).

## 2. Color Tokens

Use the CSS variable, never the raw value. Light / dark values live in `tokens.css`.

| Token | Role |
|---|---|
| `--color-primary` / `-light` / `-soft` | Brand indigo; actions, active states, links |
| `--color-on-primary` | Text/icon on primary-filled surfaces |
| `--color-secondary` / `-soft` | Violet; secondary emphasis, "chill/creative" contexts |
| `--color-success` / `-soft` | Positive results, completed states, streak health |
| `--color-warning` / `-soft` | Deadlines approaching, degraded states |
| `--color-error` / `-soft` / `-strong` | Failures, overdue, destructive actions |
| `--color-info` / `-soft` | Neutral announcements, tips |
| `--color-accent` / `-soft` | Rose; sparing highlight (XP bursts, celebration) |
| `--color-gold` / `--color-silver` / `--color-bronze` | Leaderboard ranks, medals, streak flames |
| `--color-text-primary` / `-secondary` / `-muted` | Text hierarchy |
| `--color-background` / `--color-surface` / `--color-surface-hover` / `--color-elevated` | Page → card → hover → raised card |
| `--color-border` | Hairlines and dividers |
| `--color-overlay` | Modal/drawer scrims |

Rules of thumb:
- Soft tints (`*-soft`) are backgrounds for badges/tags; the base color is the text/icon on top of them.
- One primary-filled action per view; everything else is quiet (surface + border).

## 3. Typography

- **Font**: `--font-family` — "Plus Jakarta Sans", falling back to system-ui.
- **Sizes**: `--font-size-xs` 12 · `sm` 14 · `base` 16 · `lg` 18 · `xl` 24 · `2xl` 28 (px).
- **Weights**: 400 body, 500 labels, 600 headings, 700 display/stat numbers.

## 4. Spacing (8dp grid)

`--spacing-xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 (px). Compose larger gaps from these; don't invent 13px.

## 5. Radius & Elevation

- Radius: `--border-radius-sm` 8 · `md` 12 · `lg` 20 · pills use `999px`.
- Shadows: `--shadow-elevation-1` (resting card), `-2` (hover/raised), `-soft` (hero/modal). Never hand-write box-shadows.

## 6. Interaction

- Focus: `--focus-ring` on every focusable element (`:focus-visible`).
- Motion: `--transition-fast` (150ms) for hovers, `--transition-base` (250ms) for layout/panel changes. Respect `prefers-reduced-motion`.
- Touch: `--touch-target-min` 48px minimum on buttons and tap targets.

## 7. Layout & Breakpoints

Mobile-first. Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536 (px). Wide content scrolls in its own container; the page never scrolls horizontally.

## 8. Component Rules

- Build screens from the UI kit in `frontend/src/components/ui/` (`Button`, `Card`, `Badge`, `Icon`, `SkeletonLoader`) before hand-rolling anything.
- Styling is **Tailwind CSS v4** for all new and reworked UI. Utilities are mapped to the tokens in `globals.css` (`@theme inline`): `bg-primary`, `text-fg` / `text-fg-muted` / `text-fg-faint`, `bg-surface` / `bg-surface-hover`, `border-border`, `shadow-1` / `shadow-2` / `shadow-soft`, `rounded-sm|md|lg`, status colors and their `*-soft` tints, `dark:` variant keyed to `[data-theme="dark"]`.
- Existing CSS Modules (`*.module.css`) are **legacy**: don't add new ones; migrate to Tailwind when you rework a screen. No new global CSS files; inline styles only for dynamic values (e.g. progress percentages).
- Icons are Google Material Symbols via the `Icon` component.

## 9. For future clients (Flutter)

These tokens are the contract: the Flutter app's `ThemeData` must be generated from the same palette/scale so web and mobile read as one product.
