# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omni Tracker is a Next.js (App Router) self-hosted portfolio tracker for stocks and crypto assets. It uses React 19, TypeScript 5, Tailwind CSS v4, and Bun as both the package manager and runtime.

## Commands

```bash
bun run dev              # Start dev server on http://localhost:3001
bun run build            # Production build
bun run lint             # Run ESLint
bunx prettier --write .  # Format all files
```

**Package manager: `bun`** (bun.lock present — do not use npm/yarn/pnpm).

## Architecture

### App Structure (Next.js App Router)

```
app/
  layout.tsx              # Root layout: Sidebar + Header + <main> wrapper
  page.tsx                # Dashboard: CardBalance, CardProfit, CardHoldings, quick links
  loading.tsx             # Route-level loading UI (all routes have loading.tsx)
  globals.css             # CSS variables, Tailwind v4 theme, Wanted Sans font
  Providers.tsx           # ThemeProvider (next-themes) for Sonner
  stocks/
    page.tsx              # Stock holdings table + rebalancing tab (searchParams: ?view=)
    RebalancingTab.tsx    # Per-stock target allocation client component
  crypto/
    page.tsx              # Coin prices, BTC/ETH ETF quotes, news feed
  rebalancing/
    page.tsx              # Full portfolio rebalancing with named presets
  settings/
    page.tsx              # Settings with tab routing via searchParams
    Sidebar.tsx           # Vertical (desktop) + horizontal scroll (mobile) tab nav
    constants.ts          # SETTINGS_TABS array + SettingsTabValue type
    components/           # StockDialog, StockDeleteButton, ExchangeDialog, CryptoDeleteButton
    sections/             # ProfileSection, NotificationSection, ApiSection, CryptoSection, DataSection
  api/
    backup/               # GET  — export all data as encrypted JSON download
    restore/              # POST — import backup JSON, re-encrypt API keys
    portfolio/balance/    # GET  — aggregate balance across exchanges + manual holdings
    portfolio/daily-profit/ # GET — daily profit data for CardProfit
    exchange-keys/        # CRUD for exchange API keys
    stock-holdings/       # CRUD for stock holdings
    crypto-holdings/      # CRUD for crypto holdings
    rebalance-targets/    # CRUD for per-stock rebalancing targets
    rebalance-presets/    # CRUD for named full-portfolio presets
    notifications/        # GET list, POST create, PATCH mark-all-read
    profile/              # GET + PATCH profile (name, email)
    profile/avatar/       # POST multipart upload → public/uploads/

components/
  ui/                     # shadcn/ui primitives (button, card, avatar, dialog, sheet, skeleton…)
  web/
    cards/                # CardBalance, CardProfit, CardHoldings
    buttons/              # AvatarDropdown
    layout/               # Sidebar, Header, MobileNav, NotificationBell

lib/
  db.ts                   # Bun SQLite singleton; DB_PATH env (default ./data/db.sqlite)
  crypto.ts               # AES-256-GCM encrypt/decrypt using ENCRYPTION_KEY env
  snapshot.ts             # Daily portfolio snapshot logic
  scheduler.ts            # node-cron daily snapshot at 00:00 UTC
  utils.ts                # cn() helper (clsx + tailwind-merge)
  exchange/               # binance.ts, bybit.ts, upbit.ts, okx.ts, bitget.ts
  stock/                  # yahoo.ts — Yahoo Finance stock price fetcher
  crypto/
    prices.ts             # Binance ticker prices; stablecoins hardcoded to $1
    etf.ts                # BTC/ETH ETF quotes via Yahoo Finance v8 chart API
    news.ts               # Crypto news feed
```

### Key Patterns

**Layout:** The root layout (`app/layout.tsx`) renders a global sidebar and header outside of `<main>`. Settings uses its own internal sidebar with tab state via `searchParams` — not nested routing.

**Database:** `bun:sqlite` singleton in `lib/db.ts`. DB path from `DB_PATH` env var (default `./data/db.sqlite`). All tables are created with `CREATE TABLE IF NOT EXISTS` on first access.

**Encryption:** API keys are encrypted at rest with AES-256-GCM (`lib/crypto.ts`). `ENCRYPTION_KEY` must be a 64-char hex string (32 bytes). Required at runtime — never at build time.

**Cross-component sync:** Profile picture updates are broadcast via `window.dispatchEvent(new Event('profile-updated'))` and listened to in `AvatarDropdown`.

**Mobile responsiveness:** Sidebar is `hidden lg:flex`. Mobile nav uses a Sheet drawer (`MobileNav.tsx`). Settings sidebar is horizontal-scroll on mobile, vertical on desktop. Tables use `overflow-x-auto` with hidden columns on smaller screens.

**shadcn/ui:** Configured with "new-york" style, CSS variables, and Tailwind v4. Add new components with `bunx shadcn add <component>`. UI primitives go in `components/ui/`.

**Styling:** Tailwind v4 via PostCSS — no `tailwind.config.js`. Theme tokens defined as CSS variables in `app/globals.css`. Font: Wanted Sans Variable (CDN via `@import` at top of globals.css). Use `cn()` from `@/lib/utils` for conditional class merging.

**Icons:** `@tabler/icons-react` (layout/nav) and `lucide-react` (shadcn default). Prefer `@tabler/icons-react` for new icons.

**TypeScript:** Strict mode enabled, `@/*` path alias maps to the repo root.

**Formatting:** Prettier with `prettier-plugin-tailwindcss`, single quotes, 2-space indent, trailing commas (es5), semicolons.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | 64-char hex (32 bytes). Generate: `openssl rand -hex 32` |
| `DB_PATH` | No | SQLite file path (default: `./data/db.sqlite`) |

## Docker

```bash
docker compose up -d --build
```

Volumes: `./data` → SQLite, `./uploads` → profile avatars.
