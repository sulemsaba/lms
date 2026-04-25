# Project Instructions for AI Agents

## Mandatory Pre-Generation Check
1. **Read and internalize the entire `DESIGN.md` file** before generating any UI code.
2. **Apply the provided design tokens** (colors, typography, spacing, etc.) to every generated user interface component.
3. **Do not invent or deviate from the defined tokens.** If a required style is absent, flag it for addition to the spec, but continue using the closest existing token.
4. **After generating UI code, perform a self-audit** to ensure every element adheres to the design system. Correct any visual inconsistencies.

## Build, Style, and Deployment Rules
- The design interface will be built with `MODERN_FRAMEWORK`. It will target the `TARGET_FRAMEWORK_SPEC` platform.
- All style rule details are located in the `DESIGN.md` file and must be strictly followed.
- After build completion, all relevant design style rules must be moved out of the main working branch and into a dedicated, persistent knowledge storage for future reference by me, the user.

## Commands
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Test**: `npm test`
- **Build**: `npm run build`
- **Type Check**: `npm run type-check`
- **Run Dev Server**: `npm run dev`
