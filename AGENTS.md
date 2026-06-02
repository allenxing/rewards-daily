# AGENTS.md

## What this repo is
"Rewards Daily" (成长星球) — a family habit-reward web app with two roles:
parent admin (`/admin/*`) and child (`/child/[childId]/*`). Booted from the
Vercel `with-supabase` Next.js starter; most of the starter scaffolding will
be replaced by the real product.

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
- `next-themes` for dark mode.
- `lucide-react` for icons.

## Commands
- `npm run dev` — dev server on `:3000`.
- `npm run build` / `npm run start` — prod build & serve.
- `npm run lint` — `eslint .` (flat config, `next/core-web-vitals` +
  `next/typescript`). **No `typecheck` and no test script** in `package.json`.
  When you need typecheck, run `npx tsc --noEmit` directly.

## Project layout
- `app/` — App Router pages. Currently: `page.tsx` (landing), `layout.tsx`
  (root, ThemeProvider, Geist font), `auth/{login,sign-up,forgot-password,
  update-password,confirm,error,sign-up-success}/`, `protected/` (starter
  sample). Real product routes per PRD: `/admin/*` and `/child/[childId]/*`.
- `components/` — `ui/` is shadcn-generated; `tutorial/` is starter cruft
  (can be deleted); auth forms in root (`login-form.tsx`, `sign-up-form.tsx`,
  …) are starter examples and **will be replaced** by the PRD's 4-digit
  admin-password login + per-child links.
- `lib/supabase/` — three clients, do not merge:
  - `client.ts` — browser (use in `"use client"` components).
  - `server.ts` — RSC / server actions / route handlers.
  - `proxy.ts` — session-refresh helper for the edge proxy.
- `lib/utils.ts` — `cn()` and `hasEnvVars` (truthy when both Supabase env vars
  are set; used to gate tutorial UI in the starter).
- `proxy.ts` (root) — **Next.js 16 renamed `middleware.ts` → `proxy.ts`**.
  Exports `proxy(request)` that delegates to `lib/supabase/proxy.ts`. Do not
  create a `middleware.ts`.

## Conventions that differ from defaults
- Path alias: `@/*` → repo root (`tsconfig.json`).
- shadcn aliases: `components → @/components`, `ui → @/components/ui`,
  `lib → @/lib`, `utils → @/lib/utils`, `hooks → @/hooks` (hooks dir not yet
  created — `npx shadcn@latest add <thing>` will scaffold it).
- Form pattern (per PRD §1.3): **all create/edit uses modal dialogs, never
  separate routes/Tabs**. Tabs are *only* for in-page filtering/view switching.
- Auth is email/password via Supabase in the starter, but the PRD specifies
  a 4-digit admin password stored in the `settings` table (see PRD §5.3).
  New admin auth code should follow the PRD, not the existing
  `login-form.tsx`.
- `cacheComponents: true` is enabled — favor async server components and
  avoid patterns that break PPR/caching (mutating cookies outside the proxy,
  non-deterministic reads at render time without `cache:` annotations, etc.).

## Environment
- Copy `.env.example` → `.env.local` and fill in:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the new publishable key name;
    legacy `ANON_KEY` values also work during the transition)
- Without these, `hasEnvVars` is falsy and the proxy skips auth — the app
  still runs but everything is effectively public.

## Supabase data model (per PRD §5.3)
Tables to create in Supabase, all with `created_at`/`updated_at`:
`settings`, `children`, `tasks`, `task_audit`, `wishes`, `points_records`.
RLS is mandatory (PRD §5.4): parents full CRUD, children read-only on their
own data + create-only on `task_audit`. Storage bucket: `avatar` (public read,
parent write).

## Gotchas
- `proxy.ts` matches everything except `_next/static`, `_next/image`,
  `favicon.ico`, and common image extensions (`lib/supabase/proxy.ts`).
  Unauthenticated non-root requests redirect to `/auth/login` — adjust the
  path list when adding public pages.
- `lib/supabase/proxy.ts` warns: **do not put code between
  `createServerClient` and `supabase.auth.getClaims()`** — it will cause
  random logouts. Also: always return the original `supabaseResponse` object
  with its cookies intact.
- `next.config.ts` enables `cacheComponents`; if a page starts caching
  unexpectedly, check that async server components are structured for PPR.
- `.next/`, `node_modules/`, `.env*.local`, `next-env.d.ts`, `*.tsbuildinfo`
  are gitignored.
- No CI, no pre-commit hooks, no tests configured. Don't add infrastructure
  the user didn't ask for.
