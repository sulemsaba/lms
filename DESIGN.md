# Design System

## 1. Design Philosophy
- **Clarity**: High legibility, intuitive spacing, minimal visual noise.
- **Consistency**: All UI elements use the defined token system without exception.
- **Accessibility**: Contrast ratios meet WCAG 2.1 AA standards.

## 2. Color Palette
- **Brand Primary**: #3B82F6
- **Brand Primary Dark**: #2563EB
- **Background Base**: #F8FAFC
- **Background Surface**: #FFFFFF
- **Text Primary**: #0F172A
- **Text Secondary**: #475569
- **Border Light**: #E2E8F0
- **Status Success**: #10B981
- **Status Warning**: #F59E0B
- **Status Error**: #EF4444

## 3. Typography
- **Font Family Base**:
  - Stack: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif
- **Font Scale** (rem):
  - `text-xs`: 0.75rem
  - `text-sm`: 0.875rem
  - `text-base`: 1rem
  - `text-lg`: 1.125rem
  - `text-xl`: 1.25rem
  - `text-2xl`: 1.5rem
  - `text-3xl`: 1.875rem
  - `text-4xl`: 2.25rem
- **Font Weights**:
  - `normal`: 400
  - `medium`: 500
  - `semibold`: 600
  - `bold`: 700

## 4. Spacing System (8px Grid)
- `space-0`: 0px
- `space-1`: 8px
- `space-2`: 16px
- `space-3`: 24px
- `space-4`: 32px
- `space-5`: 40px
- `space-6`: 48px
- `space-7`: 64px
- `space-8`: 80px

## 5. Border Radius
- `radius-none`: 0px
- `radius-sm`: 4px
- `radius-default`: 8px
- `radius-md`: 12px
- `radius-lg`: 16px
- `radius-full`: 9999px

## 6. Shadows
- `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `shadow-DEFAULT`: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`

## 7. Layout & Breakpoints
- **Mobile First**: Styles default to <640px.
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px
