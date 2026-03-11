# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omni Tracker is a Next.js (App Router) web app for managing stocks and crypto assets in one place. It uses React 19, TypeScript 5, and Tailwind CSS v4.

## Commands

```bash
bun run dev       # Start dev server on http://localhost:3001
bun run build     # Production build
bun run lint      # Run ESLint
bunx prettier --write .  # Format all files
```

**Package manager: `bun`** (bun.lock present — do not use npm/yarn/pnpm).

## Architecture

### App Structure (Next.js App Router)

```
app/
  layout.tsx          # Root layout: Sidebar + Header + <main> wrapper
  page.tsx            # Dashboard home, uses DashboardLayout
  globals.css         # CSS variables, Tailwind v4 theme, normalize.css
  layout/
    Sidebar.tsx       # Left nav sidebar (icon-based, w-20)
    Header.tsx        # Top header with notifications + AvatarDropdown
    DashboardLayout.tsx  # 3-column grid layout (280px | 1fr | 280px)
  settings/
    page.tsx          # Settings page with tab state management
    Sidebar.tsx       # Settings nav (tab buttons)
    constants.ts      # SETTINGS_TABS array + SettingsTabValue type
    components/       # SettingsSidebarButton
    sections/         # ProfileSection, ApiSection

components/
  ui/                 # shadcn/ui primitives (card, button, avatar, dropdown-menu)
  cards/              # Feature cards (e.g. CardPortfolioValue)
  buttons/            # Composite button components (e.g. AvatarDropdown)

lib/
  utils.ts            # cn() helper (clsx + tailwind-merge)
```

### Key Patterns

**Layout:** The root layout (`app/layout.tsx`) renders a global sidebar and header outside of `<main>`. The settings page manages its own internal sidebar with tab state via `useState` — it does not use Next.js routing for settings tabs.

**DashboardLayout:** A 3-column responsive grid (`app/layout/DashboardLayout.tsx`) used on the home page. Left and right columns are hidden on small screens (`hidden lg:flex`).

**shadcn/ui:** Configured with "new-york" style, CSS variables, and Tailwind v4. Add new components with `bunx shadcn add <component>`. UI primitives go in `components/ui/`, custom feature components go in `components/cards/` or `components/buttons/`.

**Styling:** Tailwind v4 via PostCSS — no `tailwind.config.js`. All theme tokens (colors, radius, spacing) are defined as CSS variables in `app/globals.css` under `:root`. The `--spacing` base is 4px. Use `cn()` from `@/lib/utils` for conditional class merging.

**Icons:** Two icon libraries are in use — `@tabler/icons-react` (used in layout components) and `lucide-react` (shadcn default). Prefer `@tabler/icons-react` for new layout/nav icons.

**TypeScript:** Strict mode enabled, `@/*` path alias maps to the repo root.

**Formatting:** Prettier with `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes), single quotes, 2-space indent, trailing commas (es5), semicolons.
