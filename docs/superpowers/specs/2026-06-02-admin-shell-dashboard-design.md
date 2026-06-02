# AdminShell + Dashboard — Design

**Date:** 2026-06-02
**Status:** Approved (pending spec review)
**Round:** 2

---

## Goal

Replace the placeholder `/admin` page with a fully realized admin shell (sidebar + main content) and a dashboard page that matches `design/admin-dashboard.html` visually. All other admin subroutes (`/admin/tasks`, `/admin/wishes`, `/admin/children`, `/admin/records`, `/admin/settings`) remain 404 but are reachable from the sidebar.

## Non-goals

- No real data — `lib/mock-data.ts` constants
- No interactive state — approve/reject/FAB are static markup
- No 4-digit password modal (PRD §2.1 deferred per round-1 deviation §8.1/§8.2)
- No `/child/*` routes (PRD §8.3 still pending)
- No theme switching UI (tokens ready, UI deferred)
- No `Modal` / `Tabs` / `Toast` / `EmptyState` reusable components (extract when 2nd use)

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Hybrid server/client**: RSC everywhere except `Sidebar` and `AdminShell` | Sidebar needs `usePathname` for active link highlight; everything else is static visual |
| 2 | **CSS module for layout** (`app/admin/admin.module.css`), Tailwind for color/spacing | Matches landing pattern (`app/landing.module.css`); separates layout from tokens |
| 3 | **Mock data in `lib/mock-data.ts`** | Reused by all 5 future admin subpages; central place to swap for Supabase calls |
| 4 | **All 6 sidebar nav items live**, 5 → 404 | Honest state; Next.js 404 page is the placeholder |
| 5 | **"进入孩子模式" button lives** as `<Link href="/child/1">` | Design fidelity; 404 makes the gap visible |
| 6 | **Approve/reject buttons are static** | Pure visual per round-2 decision |
| 7 | **FAB buttons are static**, modals render in default-hidden state | Pure visual; no toggle state |

## File structure

```
app/admin/
  layout.tsx          (RSC, exists — unchanged)
  page.tsx            (RSC, dashboard assembly)
  admin.module.css    (NEW: sidebar layout, slide-in, 1024px breakpoint)

components/admin/
  admin-shell.tsx     (client: Sidebar + <main> + FAB + modals)
  sidebar.tsx         (client: usePathname for active link)
  page-header.tsx     (server: title + actions)
  stat-card.tsx       (server: 1 stat card)
  stats-grid.tsx      (server: 4 stat cards)
  review-item.tsx     (server: single review row)
  review-list.tsx     (server: 3 review rows)
  review-section.tsx  (server: card wrapping review-list)
  floating-actions.tsx (server: 2 FAB buttons)
  point-adjustment-modal.tsx (server: 2 modals, hidden by default)

lib/
  mock-data.ts        (NEW: stats, reviews, children, tasks)
```

## Component specs

### `AdminShell` (client)
- Receives `{ children: React.ReactNode }`
- Renders `<Sidebar />` + `<main className={mainClass}>{children}</main>` + `<FloatingActions />` + `<PointAdjustmentModals />`
- Imports CSS module for layout

### `Sidebar` (client)
- Fixed 240px width on `lg` (≥1024px), slide-in drawer on `<lg`
- Logo block: 36×36 rounded square (cafe primary) + 文本 "成长星球"
- Nav: 6 `<Link>` items, each: icon (lucide) + label
- Active state: 4px left bar + cafe primary text + 6% cafe primary bg (matches design `.nav-link.active`)
- Footer: 退出登录 button → calls `signOut` (existing `LogoutButton` from starter, modified to `/`)
- Uses `usePathname()` to detect active route
- Mobile: hamburger toggle + overlay (design has JS for this — we'll skip the toggle, sidebar just stays hidden on mobile to match "pure visual")

### `PageHeader` (server)
- Props: `{ title: string; actions?: React.ReactNode }`
- Renders: title (left) + actions slot (right)
- "进入孩子模式" action: `<Link href="/child/1">`, outline style, lucide `Sparkles` icon
- **No hamburger button** — mobile sidebar stays hidden (no toggle this round; design has JS toggle, omitted as "pure visual")

### `StatCard` (server)
- Props: `{ icon: React.ReactNode; value: string; label: string; tone: 'warning' | 'primary' | 'success' | 'info' }`
- Renders: 52×52 icon block (tone bg + tone fg) + value (mono, 1.75rem, bold) + label (0.8125rem, secondary)
- 4 instances: 今日待审核 (warning) / 孩子总积分 (primary) / 今日已完成 (success) / 待达成愿望 (info)

### `ReviewItem` (server)
- Props: `{ avatarBg: string; avatarFg: string; task: string; child: string; time: string; points: number }`
- Renders: 40×40 avatar circle + task name (0.9375rem bold) + meta row (child, time, success badge) + actions (通过/拒绝 buttons)
- Approve/reject buttons: static, no handlers, match design

### `FloatingActions` (server)
- Fixed bottom-right, 2 buttons (add/deduct), 48×48 circular
- Each: lucide `Plus` / `Minus` icon, secondary style (white bg, cafe primary fg, primary border)
- No onClick — pure visual

### `PointAdjustmentModal` (server)
- 2 modals: 加分 / 扣分
- Each: overlay (cafe dark 40% + 4px blur) + modal box (surface bg, 480px max) + header (title + close ×) + body (3 form fields) + footer (取消 + 确认)
- Form fields: 孩子 select / 积分数 input / 原因 text
- Default state: hidden (`opacity: 0; visibility: hidden`) per design
- No submit handler — form has `onSubmit={undefined}` essentially, just visual

## Mock data shape

```ts
// lib/mock-data.ts
export const dashboardStats = {
  pendingReview: 3,
  totalPoints: 1280,
  completedToday: 5,
  pendingWishes: 2,
} as const;

export type ReviewItem = {
  id: string;
  taskName: string;
  childName: string;
  submitTime: string;     // "今天 08:30"
  points: number;
  avatarBg: string;       // "#E8D5C4"
  avatarFg: string;       // "var(--primary)"
};

export const dashboardReviews: ReviewItem[] = [
  { id: '1', taskName: '刷牙打卡', childName: '小明', submitTime: '今天 08:30', points: 5,  avatarBg: '#E8D5C4', avatarFg: '#5D4432' },
  { id: '2', taskName: '亲子阅读15分钟', childName: '小红', submitTime: '今天 09:15', points: 10, avatarBg: '#D5E8D4', avatarFg: '#2D7D46' },
  { id: '3', taskName: '整理玩具', childName: '小明', submitTime: '今天 10:00', points: 5,  avatarBg: '#E8D5C4', avatarFg: '#5D4432' },
];

export const children = [
  { id: '1', name: '小明' },
  { id: '2', name: '小红' },
] as const;
```

## Styling tokens (already in place)

- `bg-cafe-surface` / `bg-cafe-primary` / `bg-white`
- `text-cafe-text` / `text-cafe-text-secondary` / `text-cafe-primary`
- `border-cafe-border`
- Font: `font-poppins` class from `app/layout.tsx` (Poppins via `next/font`)
- Tailwind arbitrary values for one-offs: `bg-[#FEF3C7]` (stat icon warning), `text-[#92400E]` (badge warning), etc.

## Responsive behavior

- `lg` (≥1024px): sidebar fixed left 240px, main content `margin-left: 240px`, stats grid 4 cols
- `md` (<1024px, ≥480px): sidebar hidden, stats grid 2 cols, page padding 16px
- `<480px`: stats grid 1 col, review item stacks vertically (avatar top, actions full-width)
- Mobile sidebar: hidden (no hamburger toggle this round — page header has no toggle button)

## Verification

- [ ] `npm run lint` 0 errors
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npm run dev` and visit `/admin` (with env vars set + logged in)
- [ ] Sidebar shows 6 items, `/admin` link is highlighted
- [ ] Stats grid shows 4 cards with correct values + icons
- [ ] Review list shows 3 items with avatars, approve/reject buttons present
- [ ] FAB visible bottom-right, 2 buttons
- [ ] Mobile (resize <1024px): sidebar hidden, stats 2-col, page padded
- [ ] Click sidebar `/admin/tasks` → 404 page (expected, not regression)
- [ ] Click "进入孩子模式" → 404 page
- [ ] No console errors / hydration warnings

## Risks

1. **Hydration mismatch on Sidebar active state**: `usePathname` runs on both server and client; ensure it returns the same value during initial render. Next.js handles this.
2. **Modal z-index vs sidebar**: modals are `z-1000`, sidebar is `z-50`, FAB is `z-40`. Confirmed no conflict.
3. **Mobile sidebar without toggle**: design has JS toggle, we omit. This means on mobile the sidebar is unreachable. Acceptable for pure-visual round; add toggle next round when child pages exist.
