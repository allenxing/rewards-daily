# AGENTS.md

## What this repo is
"Rewards Daily" (成长星球) — a family habit-reward web app with two roles:
parent admin (`/admin/*`) and child (`/child/[shareToken]/*`). Booted from the
Vercel `with-supabase` Next.js starter; most of the starter scaffolding has
been replaced by the real product.

Source of truth for product behavior: `docs/prd.md`. Read it before designing
or changing any page/route/data model.

## Required reading first
- `docs/prd.md` — canonical PRD (routes, tables, RLS, UI tokens, layout rules).
- `design/*.html` + `design/shared.css` — static visual prototypes
  (parent/child pages). Reference for look-and-feel only; **do not import
  these into the Next app** — they're plain HTML, not React.

## Stack (pinned by installed versions, not `package.json` ranges)
- Next.js **16.2.7** (App Router, RSC) with `cacheComponents: true`
  (`next.config.ts`).
- React 19, TypeScript 5 (strict).
- Tailwind CSS 3 + `tailwindcss-animate`; shadcn/ui `new-york` style, `neutral`
  base, CSS variables (`components.json`).
- `@supabase/ssr` 0.10.3 for auth + data.
- `next-intl` 4.13 for i18n (cookie-based locale, zh/en).
- `next-themes` for dark mode.
- `lucide-react` for icons.

## Commands
- `npm run dev` — dev server on `:3000`.
- `npm run build` / `npm run start` — prod build & serve.
- `npm run lint` — `eslint .` (flat config, `next/core-web-vitals` +
  `next/typescript`). **No `typecheck` and no test script** in `package.json`.
  When you need typecheck, run `npx tsc --noEmit` directly.

## Project layout
- `app/` — App Router pages: `page.tsx` (landing), `layout.tsx` (root, IntlProvider,
  ThemeProvider, ToastProvider), `auth/{login,sign-up,…}/` (legacy starter, being
  replaced), `admin/*` (all 6 pages), `child/[shareToken]/*`.
- `components/` — `ui/` is shadcn-generated; `admin/` (sidebar, review, etc),
  `child/` (header, nav, task/wish cards, child-gate), `common/` (modal, toast,
  tabs, toggle, color-picker, intl-provider, locale-toggle), `landing/`.
- `lib/supabase/` — three clients, do not merge:
  - `client.ts` — browser (use in `"use client"` components).
  - `server.ts` — RSC / server actions / route handlers.
  - `proxy.ts` — session-refresh helper for the edge proxy.
- `lib/i18n.ts` — next-intl `getRequestConfig` (reads `NEXT_LOCALE` cookie).
- `messages/` — `zh.json` (full) + `en.json` (translated).
- `proxy.ts` (root) — **Next.js 16 renamed `middleware.ts` → `proxy.ts`**.
  Exports `proxy(request)` that delegates to `lib/supabase/proxy.ts`. Do not
  create a `middleware.ts`.

## Conventions that differ from defaults
- Path alias: `@/*` → repo root (`tsconfig.json`).
- shadcn aliases: `components → @/components`, `ui → @/components/ui`,
  `lib → @/lib`, `utils → @/lib/utils`, `hooks → @/hooks`.
- Form pattern (per PRD §1.3): **all create/edit uses modal dialogs, never
  separate routes/Tabs**. Tabs are *only* for in-page filtering/view switching.
- Auth is email/password via Supabase (legacy starter); 4-digit admin password
  is stored in `settings.admin_pwd` but not yet wired to login.
- `cacheComponents: true` is enabled — favor async server components and
  avoid patterns that break PPR/caching. Wrap client components that use
  zustand/cookies in `<Suspense>`.
- i18n: `next-intl` with cookie-based locale (`NEXT_LOCALE`). Server:
  `getTranslations("ns")`. Client: `useTranslations("ns")`.
  `timeZone="Asia/Shanghai"` must be set on `NextIntlClientProvider`.

## Environment
- Copy `.env.example` → `.env.local` and fill in:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the new publishable key name;
    legacy `ANON_KEY` values also work during the transition)
- Without these, `hasEnvVars` is falsy and the proxy skips auth — the app
  still runs but everything is effectively public.

## Supabase data model
Tables (all with `created_at`/`updated_at` + `owner_id` FK to `auth.users`):
`settings`, `children`, `tasks`, `task_assignments`, `task_audit`, `wishes`,
`points_records`.
RLS: authenticated owners have full CRUD; anon can SELECT children (by
`share_token`) only. Storage bucket `avatar` (public read, authenticated write).

DB functions (via `supabase.rpc()`):
`approve_task`, `redeem_wish`, `adjust_points`, `verify_child_password`,
`check_child_access_enabled` — all SECURITY DEFINER (bypass RLS).

## Gotchas
- `proxy.ts` matches everything except `_next/static`, `_next/image`,
  `favicon.ico`, and common image extensions (`lib/supabase/proxy.ts`).
  Unauthenticated non-root requests redirect to `/auth/login` — adjust the
  path list when adding public pages. `/child/*` is explicitly whitelisted.
- `lib/supabase/proxy.ts` warns: **do not put code between
  `createServerClient` and `supabase.auth.getClaims()`** — it will cause
  random logouts. Also: always return the original `supabaseResponse` object
  with its cookies intact.
- `next.config.ts` enables `cacheComponents`; if a page starts caching
  unexpectedly, check that async server components are structured for PPR.
- Child page password protection uses SECURITY DEFINER RPC functions to
  bypass RLS (no service role key needed).
- `.next/`, `node_modules/`, `.env*.local`, `next-env.d.ts`, `*.tsbuildinfo`
  are gitignored.
- No CI, no pre-commit hooks, no tests configured.
