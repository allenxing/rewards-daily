# Empty States + Child Navigation Optimization

## 1. Motivation

- Current empty state copy/icons are inconsistent across 9 scenarios
- Child page tab switching causes full page reload (ChildShell remounts)

## 2. Empty States (warm/encouraging + lucide icons)

### Child 端 (6 scenarios)

| # | 场景 | Icon | 标题 | 描述 |
|---|------|------|------|------|
| 1 | 首页全部完成 | `PartyPopper` | 今天全部完成啦! | 太棒了,快去梦想宝库看看有没有想兑换的吧 |
| 2 | 任务-可做空 | `ClipboardList` | 暂时没有新任务 | 等妈妈爸爸安排新任务后,就能继续赚星星啦 |
| 3 | 任务-审核中空 | `Clock` | 没有审核中的任务 | 完成任务后提交,等家长通过就能拿到星星了 |
| 4 | 任务-已完成空 | `Trophy` | 还没有完成过任务 | 去「可做任务」选一个开始吧,每完成一项都有星星奖励 |
| 5 | 梦想-兑换历史空 | `Gift` | 还没有兑换过梦想 | 攒够星星就能实现第一个梦想,加油! |
| 6 | 梦想-进行中空 | `Sparkles` | 梦想宝库还在建设中 | 让家长帮你添加几个愿望吧 |

### Admin 端 (3 scenarios)

| # | 场景 | Icon | 标题 | 描述 |
|---|------|------|------|------|
| 7 | 任务列表空 | `FilePlus` | 还没有创建任务 | 点击「新增任务」给孩子们安排任务吧 |
| 8 | 流水记录空 | `Receipt` | 暂无流水记录 | 当孩子完成任务或兑换梦想后,这里会显示详细记录 |
| 9 | 待审核空 | `CheckCircle` | 没有待审核任务 | 孩子们提交任务后,你可以在这里审核通过或拒绝 |

All use lucide-react icons. Visual style: centered icon (48px, muted color) + bold title + lighter description.

## 3. Child Layout — Shell Persistence

### Problem

Navigating between `/child/[shareToken]`, `/child/[shareToken]/tasks`, `/child/[shareToken]/wishes` remounts `ChildShell` entirely (header + bottom nav + starry background re-render).

### Solution: `app/child/[shareToken]/layout.tsx`

```
app/child/[shareToken]/layout.tsx        ← NEW
  getChildByShareToken(shareToken)
  if !child → notFound()
  <ChildShell child={child}>
    {children}                           ← page-specific content
  </ChildShell>

app/child/[shareToken]/page.tsx          ← simplified, only middle content
app/child/[shareToken]/tasks/page.tsx    ← simplified
app/child/[shareToken]/wishes/page.tsx   ← simplified
```

### Key points

- Layout fetches child data once, passes as `child` prop to `ChildShell`
- Each page **does NOT** call `getChildByShareToken` — it already has `shareToken` from `params` and can pass it to data-fetching functions (`getTasksForChildByShareToken`, `getAuditsForChild`, `getWishesForChild`) that only need the share token string. If a page needs the `child` object (e.g., `child.id`), the layout can pass it via a shared namespace or the page can accept it from layout — simplest: pages use `shareToken` directly for queries and don't need the child object at all (existing queries already accept shareToken).
- `notFound()` centralized in layout — any page under `/child/[shareToken]` 404s automatically if shareToken invalid
- `metadata.robots` (noindex) moves to layout so it's shared by all child pages
- `ChildShell` accepts `child` prop as before, layout passes it through
- Server actions revalidate paths → layout re-fetches child data on next request (acceptable — not real-time critical)

### Not in scope

- Client-side tab switching within a single route (user chose B, not A)
- Loading states / skeleton for layout (future)

## 4. Files changed

### New
- `app/child/[shareToken]/layout.tsx`

### Modified
- `app/child/[shareToken]/page.tsx` — remove `getChildByShareToken`, `<ChildShell>`, `<Suspense>`
- `app/child/[shareToken]/tasks/page.tsx` — same
- `app/child/[shareToken]/wishes/page.tsx` — same
- All 9 empty-state locations across admin/child pages — replace text/icons

### No change
- `ChildShell`, `ChildHeader`, `ChildBottomNav` — their interfaces stay the same
- Admin empty states: only copy/icon changes, no structural change
