# Implementation Plan: Empty States + Child Nav Optimization

## Overview

Two independent workstreams in a single commit:
1. **Child layout**: create `app/child/[shareToken]/layout.tsx` (对标 admin 模式)
2. **Empty states**: update all 9 empty-state locations with warm copy + lucide icons

---

## Task 1: Child Layout

### New file: `app/child/[shareToken]/layout.tsx`

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChildByShareToken } from "@/lib/queries/children";
import { ChildShell } from "@/components/child/child-shell";

export const metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ shareToken: string }>; children: React.ReactNode };

export default function ChildLayout({ params, children }: Props) {
  return (
    <Suspense fallback={null}>
      <ChildLayoutInner params={params}>{children}</ChildLayoutInner>
    </Suspense>
  );
}

async function ChildLayoutInner({ params, children }: Props) {
  const { shareToken } = await params;
  const child = await getChildByShareToken(shareToken);
  if (!child) notFound();
  return <ChildShell child={child}>{children}</ChildShell>;
}
```

### Modified: 3 child pages

All three remove:
- `Suspense` wrapper
- `getChildByShareToken` import + call
- `notFound` import + check
- `ChildShell` import + rendering
- `metadata` export (moved to layout)

Only keep: data fetching + content rendering + style imports.

Files:
- `app/child/[shareToken]/page.tsx`
- `app/child/[shareToken]/tasks/page.tsx`
- `app/child/[shareToken]/wishes/page.tsx`

---

## Task 2: Empty States

### 2.1 Import mapping

| Scenario | File | Current Icon | New Icon (lucide) |
|---|---|---|---|
| 1. 首页全部完成 | `app/child/[shareToken]/page.tsx:71` | `✨` text | `PartyPopper` |
| 2. 任务-可做空 | `app/child/[shareToken]/tasks/page.tsx:75` | `✨` text | `ClipboardList` |
| 3. 任务-审核中空 | `app/child/[shareToken]/tasks/page.tsx:76` | `🔍` text | `Clock` |
| 4. 任务-已完成空 | `app/child/[shareToken]/tasks/page.tsx:77` | `📋` text | `Trophy` |
| 5. 梦想-历史空 | `app/child/[shareToken]/wishes/page.tsx` | `🎉` text | `Gift` |
| 6. 梦想-进行中空 | `app/child/[shareToken]/wishes/page.tsx` | `🎁` text | `Sparkles` |
| 7. 任务列表空 | `app/admin/tasks/tasks-client.tsx:82` | `📋` text | `FilePlus` |
| 8. 流水记录空 | `app/admin/records/records-client.tsx:135` | `<BarChart3>` | `<Receipt>` |
| 9. 待审核空 | `components/admin/review-list.tsx:8` | `✨` text | `<CheckCircle>` |

### 2.2 New copy

| # | Title | Description |
|---|---|---|
| 1 | 今天全部完成啦! | 太棒了,快去梦想宝库看看有没有想兑换的吧 |
| 2 | 暂时没有新任务 | 等妈妈爸爸安排新任务后,就能继续赚星星啦 |
| 3 | 没有审核中的任务 | 完成任务后提交,等家长通过就能拿到星星了 |
| 4 | 还没有完成过任务 | 去「可做任务」选一个开始吧,每完成一项都有星星奖励 |
| 5 | 还没有兑换过梦想 | 攒够星星就能实现第一个梦想,加油! |
| 6 | 梦想宝库还在建设中 | 让家长帮你添加几个愿望吧 |
| 7 | 还没有创建任务 | 点击「新增任务」给孩子们安排任务吧 |
| 8 | 暂无流水记录 | 当孩子完成任务或兑换梦想后,这里会显示详细记录 |
| 9 | 没有待审核任务 | 孩子们提交任务后,你可以在这里审核通过或拒绝 |

### 2.3 CSS considerations

- **Child side**: current `styles.emptyEmoji` renders as `<div>` with large text emoji. Replace with lucide `<Icon size={48} className={styles.emptyEmoji} />` — verify the CSS already handles this (likely yes, since `.emptyEmoji` just sets size/opacity)
- **Admin side**: `styles.emptyStateIcon` already supports lucide components (records-client uses `<BarChart3 size={48} />`)

---

## Task 3: Regression check

```
npm run lint
npx tsc --noEmit
rm -rf .next && npm run build
```

## Files summary

### New (1)
- `app/child/[shareToken]/layout.tsx`

### Modified (6)
- `app/child/[shareToken]/page.tsx`
- `app/child/[shareToken]/tasks/page.tsx`
- `app/child/[shareToken]/wishes/page.tsx`
- `app/admin/tasks/tasks-client.tsx`
- `app/admin/records/records-client.tsx`
- `components/admin/review-list.tsx`

### Unchanged
- `ChildShell`, `ChildHeader`, `ChildBottomNav` — interfaces unchanged
- All server actions — no change needed
