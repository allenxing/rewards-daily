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

### Solution: `app/child/[shareToken]/layout.tsx` (对标 admin 模式)

```
app/child/[shareToken]/layout.tsx     ← NEW
  <Suspense fallback={null}>
    <ChildLayoutInner {children}>
      getChildByShareToken(shareToken)
      if !child → notFound()
      <ChildShell child={child}>
        {children}                    ← page-specific content
      </ChildShell>
    </ChildLayoutInner>
  </Suspense>

app/child/[shareToken]/page.tsx       ← 只保留中间内容,无 ChildShell
app/child/[shareToken]/tasks/page.tsx ← 只保留中间内容,无 ChildShell
app/child/[shareToken]/wishes/page.tsx← 只保留中间内容,无 ChildShell
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

- 完全对标 `app/admin/layout.tsx` 模式: `<Suspense>` + async inner + fetch → wrap shell
- Layout 统一调用 `getChildByShareToken(shareToken)`, `notFound()` 集中处理
- 三个 page 移除: `ChildShell` 渲染、`getChildByShareToken` 调用、`notFound()` 检查、各自的 `<Suspense>` 包装
- `metadata.robots` (noindex) 移到 layout 统一声明
- `ChildShell` 接口不变,仍接收 `child` prop
- 每个 page 仍然独立 fetch 自身数据 (tasks/audits/wishes),只需 `shareToken` 参数,不需要 child 对象
- Server action revalidate 后 layout 下次请求重新 fetch child (可接受)

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
