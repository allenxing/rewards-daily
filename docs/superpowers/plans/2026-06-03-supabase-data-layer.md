# Supabase 数据层全量接入 — Implementation Plan

> **Spec**: [`../specs/2026-06-03-supabase-data-layer-design.md`](../specs/2026-06-03-supabase-data-layer-design.md)
> **Date**: 2026-06-03
> **Strategy**: 8 commits,每 commit 独立可运行 + 验证。每个 task 都标 `MUST RUN` / `MUST CHECK`。

---

## Conventions

- **Worktree**: 整个 plan 在 main 推进,每 phase 一个 commit。
- **Lint/typecheck**: 每 phase 末必跑 `npx tsc --noEmit` + `npm run lint` + `npm run build`。
- **DB**: `supabase_apply_migration` 用 MCP 工具;`supabase_generate_typescript_types` 在 migration 3 跑完后立即跑。
- **Dev server**: `npm run dev` 跑在 `:3000`,验证用第二个浏览器/隐身窗口。
- **Commit format**: `<type>(<scope>): <subject>` `type` ∈ {feat, refactor, docs, chore, fix}。
- **Files referenced by `@/`** = repo root path alias(`tsconfig.json`)。

---

## Phase 1 — DB + Skeleton 基础设施

**Goal**: 7 表 → 7 表(多租户) + 3 RPC + RLS 重写 + types 生成 + queries/stores/hooks/utils 骨架。

**Pre-conditions**:
- 现有 schema 已 `supabase_apply_migration` 部署
- 现有种子数据(小明/小红/5 任务/5 愿望)将被清空

**Tasks**:

### Task 1.1 — Migration 1:多租户字段

**Files**: `supabase/migrations/2026-06-03-multitenant.sql`

**Steps**:
1. 写 migration 内容(见 spec §5.1)
2. `MCP:supabase_apply_migration name="2026-06-03-multitenant" query=<SQL>`
3. `MCP:supabase_execute_sql` 验证:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'children' AND column_name IN ('owner_id','share_token');
   -- 期望: 2 行
   SELECT trigger_name FROM information_schema.triggers
   WHERE event_object_table = 'users' AND trigger_schema = 'auth';
   -- 期望: 1 行 (on_auth_user_created)
   ```

### Task 1.2 — Migration 2:RPC 函数

**Files**: `supabase/migrations/2026-06-03-rpc-functions.sql`

**Steps**:
1. 写 3 个 `create function`(见 spec §3.4)
2. `MCP:apply_migration`
3. `MCP:execute_sql`:
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('approve_task','redeem_wish','adjust_points');
   -- 期望: 3 行
   ```

### Task 1.3 — Migration 3:RLS 重写

**Files**: `supabase/migrations/2026-06-03-rls-rewrite.sql`

**Steps**:
1. DROP + CREATE policies(见 spec §5.3)
2. `MCP:apply_migration`
3. `MCP:execute_sql`:
   ```sql
   SELECT polname, polroles::text FROM pg_policy
   WHERE schemaname = 'public' AND polname LIKE '%_share_%' OR polname LIKE '%_owner_%';
   -- 期望: 14 个 policies
   ```

### Task 1.4 — 生成 TS types

**Steps**:
1. `MCP:supabase_generate_typescript_types`
2. 输出保存到 `lib/database.types.ts`
3. `MUST CHECK:grep -c "owner_id" lib/database.types.ts` ≥ 6
4. `MUST CHECK:grep "share_token" lib/database.types.ts` 至少 1 行

### Task 1.5 — 骨架文件创建

**Files**:
- `lib/queries/index.ts`(barrel,全部 export)
- `lib/queries/{settings,children,tasks,task-audit,wishes,points-records,dashboard,storage}.ts`(8 个空文件,各 export 一行 `// stub: see task X.Y`)
- `lib/utils/errors.ts`
- `lib/ui-presets.ts`(从 `lib/mock-data.ts` 抽 themePresets / adminColorPresets / iconPresets,纯静态常量)
- `lib/stores/index.ts`
- `lib/stores/{ui,toast-queue,optimistic-points}.ts`(各空 Zustand store,只 export 类型 + 空 `create`)
- `lib/hooks/use-record-filters.ts`(返回 hardcoded `{filters:{}, setFilter:()=>{}}`)

**Steps**:
1. 写每个空文件
2. `MUST RUN:npx tsc --noEmit` 期望 0 错
3. `MUST RUN:npm run lint` 期望 0 错

**Commit**: `chore(db): add multi-tenant + RPC + RLS + types skeleton`

---

## Phase 2 — Read 路径(9 pages)

**Goal**: 全部 server page `await` Supabase;client 不直调;`/child/[childId]` → `/child/[shareToken]`;静态常量走 `lib/ui-presets.ts`;mock-data 文件保留(后续 phase 8 删)。

### Task 2.1 — `lib/queries/settings.ts`

**Signature**: 见 spec §3.1
**Internal**: 调 `getUser()` → 调 `supabase.from('settings').select().eq('owner_id', user.id).single()`;RSC 缓存 `cache: 'force-cache'`,no store 注入

### Task 2.2 — `lib/queries/children.ts`

- `getChildren()`:`.from('children').select('*').eq('owner_id', user.id).order('created_at')`
- `getChildByShareToken(token)`:`.from('children').select('*').eq('share_token', token).maybeSingle()`
- 类型映射:`db_share_token` 暴露为 UI 不读(只 server 内部用);`id / name / age / avatar_url / total_points / created_at` → camelCase

### Task 2.3 — `lib/queries/tasks.ts`

- `getTasksForAdmin()`:JOIN `task_assignments` 拿 `assignedChildren: number[]`;`status='closed'` 用 `closed_reason` 字段
- `getTasksForChild(shareToken)`:先 `getChildByShareToken` 拿 childId,再 `.from('tasks').select('*, task_assignments!inner(child_id)').eq('task_assignments.child_id', childId).eq('status','active')`
- 类型映射:加 `iconBg` / `iconColor` 派生字段(从 `icon` 字符哈希到 `themePresets` 的 6 色调色板)

### Task 2.4 — `lib/queries/task-audit.ts`

- `getPendingAudits(limit=20)`:JOIN tasks + children,按 `submit_time` desc
- `getAuditsForChild(shareToken, filter)`:先 childId,再 `task_audit.eq('child_id', childId)`,按 filter 加 WHERE

### Task 2.5 — `lib/queries/wishes.ts`

- `getWishesForAdmin()`:JOIN children 拿 childName;按 `created_at` desc
- `getWishesForChild(shareToken)`:JOIN 算 `progress%` = `child.total_points / wish.target_points * 100`

### Task 2.6 — `lib/queries/points-records.ts`

- `getRecords(filters)`:`childId?` / `type?` / `dateFrom?` / `dateTo?` 全用 `.eq/.gte/.lte`
- `getRecordSummary(childId?, monthFrom?)`:用 `v_child_summary` 视图

### Task 2.7 — `lib/queries/dashboard.ts`

- `getDashboardStats()`:调 `.from('v_dashboard_stats').select().eq('owner_id', user.id).single()`
- `getChildSummaries()`:调视图,直接 select
- `getWishProgress(wishId)`:用 `v_wish_progress` 视图

### Task 2.8 — `lib/queries/storage.ts`

- `uploadAvatar(childId, file)`:文件名 `${childId}_${Date.now()}.${ext}`;调 `.from('avatar').upload(path, file, { upsert: true })`;返回 public URL
- `getAvatarUrl(path)`:调 `.from('avatar').getPublicUrl(path).data.publicUrl`

### Task 2.9 — 改写 6 admin page + 1 admin layout

**Files**:
- `app/admin/page.tsx`(`await getDashboardStats() + getChildSummaries() + getPendingAudits()`)
- `app/admin/tasks/page.tsx`(`await getTasksForAdmin() + getChildren()`)
- `app/admin/wishes/page.tsx`(`await getWishesForAdmin() + getChildren()`)
- `app/admin/children/page.tsx`(`await getChildren()`)
- `app/admin/records/page.tsx`(`await getRecords(searchParams)`)
- `app/admin/settings/page.tsx`(`await getSettings()`)
- `app/admin/layout.tsx`(user check;无 user → redirect `/auth/login`)

**Steps**: 每个 page 把 `import { ... } from "@/lib/mock-data"` 替换为 `import { ... } from "@/lib/queries"`(barrel);函数调同步改

### Task 2.10 — 改写 3 child page + 1 child layout

**Files**:
- `app/child/[childId]/page.tsx` → 改路径到 `app/child/[shareToken]/page.tsx`(删旧目录)
- `app/child/[shareToken]/tasks/page.tsx`(`await getChildByShareToken + getTasksForChild + getAuditsForChild`)
- `app/child/[shareToken]/wishes/page.tsx`(`await getChildByShareToken + getWishesForChild`)
- `app/child/[shareToken]/layout.tsx`(`<meta name="robots" content="noindex">` + token → childId 转换)
- `app/child/not-found.tsx`(返回"链接无效"页面)

**MUST CHECK**:
- `find app/child -name "page.tsx"` 路径都含 `[shareToken]`
- `find app/child -path "*[childId]*"` 0 结果

### Task 2.11 — 8 个 client 组件去掉 mock-data import

**Files**:
- `components/admin/review-item.tsx`, `review-section.tsx`, `stats-grid.tsx`, `floating-actions.tsx`, `review-list.tsx`, `admin-shell.tsx`
- `components/child/wish-card.tsx`, `task-card.tsx`, `child-shell.tsx`

**Steps**: props 改成 server 透传,client 组件不再 import types from mock-data;改 from `@/lib/queries`

### Task 2.12 — `lib/ui-presets.ts`

从 `lib/mock-data.ts` 抽:
- `THEME_PRESETS` (6 项)
- `ADMIN_COLOR_PRESETS` (5 项)
- `ICON_PRESETS` (15 个 icon 名 → lucide name)

**MUST RUN**:
- `npx tsc --noEmit` 0 错
- `npm run build` 成功
- `npm run dev` 启动后:注册新账号 → `/admin` 空态(因 trigger 自动建 settings)→ 看到 0 任务/0 孩子
- 第二个浏览器:开 `/admin` → 被 proxy 重定向到 `/auth/login`

**Commit**: `refactor(read): all 9 pages read from Supabase via queries`

---

## Phase 3 — 写路径:12 个非原子 action

**Goal**: `lib/actions.ts` 全部改用 Supabase + 调 `revalidatePath` + 返回 `ActionResult`。

### Task 3.1 — `lib/actions.ts` 重构

**Pattern**:
```ts
"use server";
type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

export async function addTaskAction(fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  const name = fd.get("name")?.toString();
  if (!name) return { ok: false, error: "任务名必填" };
  const { data, error } = await supabase.from("tasks").insert({
    owner_id: user.id, name, /* ... */
  }).select().single();
  if (error) return { ok: false, error: translateSupabaseError(error.message) };
  revalidatePath("/admin/tasks");
  return { ok: true, data };
}
```

### Task 3.2 — 12 个 action 实装

| # | Action | 影响表 | revalidatePath |
|---|---|---|---|
| 1 | `addTaskAction` | tasks + task_assignments | /admin/tasks, /admin, /child/[token]/tasks |
| 2 | `updateTaskAction` | tasks (含 cycle/points), task_assignments diff | 同上 |
| 3 | `closeTaskAction` | tasks SET status=false, closed_reason | 同上 |
| 4 | `restoreTaskAction` | tasks SET status=true, closed_reason=NULL | 同上 |
| 5 | `submitTaskAction(taskId: string)` | task_audit INSERT pending | /admin, /child/[token] |
| 6 | `rejectTaskAction` | task_audit SET refuse + audit_time | /admin, /child/[token] |
| 7 | `addWishAction` | wishes | /admin/wishes, /child/[token]/wishes |
| 8 | `updateWishAction` | wishes | 同上 |
| 9 | `lockWishAction` | wishes SET is_lock=? | 同上 |
| 10 | `deleteWishAction` | wishes | 同上 |
| 11 | `addChildAction` | children | /admin, /admin/children, /admin/tasks, /admin/wishes |
| 12 | `updateChildAction` | children | 同上 |
| 13 | `deleteChildAction` | children (CASCADE 全清) | 同上 |
| 14 | `uploadAvatarAction` | storage + children.avatar_url | /admin/children, /admin/tasks(/wishes 用 children.name) |

### Task 3.3 — Client 组件消费新返回类型

**Files**: `*-client.tsx` 7 个 + `components/admin/floating-actions.tsx` + `components/child/task-card.tsx` + `components/child/wish-card.tsx`

**Pattern**:
```ts
const [isPending, startTransition] = useTransition();
const start = () => startTransition(async () => {
  const r = await addTaskAction(fd);
  if (r.ok) toast.success("添加成功");
  else toast.error(r.error);
});
```

### Task 3.4 — Delete child 二次确认

**File**: `app/admin/children/children-client.tsx`

**Logic**:
```ts
const handleDelete = async (child: Child) => {
  const { data: counts } = await supabase.rpc("count_child_refs", { p_child_id: child.id });
  if (!confirm(`确定删除 ${child.name}?\n\n将级联删除:\n· ${counts.tasks} 个任务分配\n· ${counts.audits} 条任务记录\n· ${counts.wishes} 个愿望\n· ${counts.records} 条积分流水`)) return;
  const r = await deleteChildAction(new FormData());  // or call directly
  if (r.ok) toast.success("已删除");
};
```

**Note**: `count_child_refs` 暂时 client 端用 4 次 `.from('...').select('id', { count: 'exact', head: true })` 拼,避免再多一个 RPC。

### Task 3.5 — 验证

**MUST RUN**:
- `npx tsc --noEmit` 0 错
- `npm run build` 0 错
- Dev 验证流程 1-10 步(全 CRUD 通)
- 第二个账号注册后 0 可见数据

**Commit**: `feat(write): 12 non-atomic server actions hit Supabase`

---

## Phase 4 — 原子 3 个 action via RPC

**Goal**: `approveTaskAction` / `redeemWishAction` / `adjustPointsAction` 改 RPC 调用。

### Task 4.1 — `approveTaskAction`

```ts
export async function approveTaskAction(fd: FormData): Promise<ActionResult<{ points: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  const auditId = Number(fd.get("auditId"));
  const { data, error } = await supabase.rpc("approve_task", { p_audit_id: auditId });
  if (error) return { ok: false, error: translateSupabaseError(error.message) };
  revalidatePath("/admin", "layout");
  return { ok: true, data: { points: data.points } };
}
```

### Task 4.2 — `redeemWishAction`

- 接收 `wishId: number`(client 先 `getWishById` 拿 wishId,因 anon 端不暴露 RPC 内部流程)
- 内部:`.from('wishes').select('child_id, children(share_token)').eq('id', wishId).single()` 拿 share_token → 调 `redeem_wish` RPC
- 或更简单:client 传 `shareToken`,server action 直接调 RPC(权限更清晰)
- 选第二种:`redeemWishAction({ wishId, shareToken })`
- **注**: child 端 `wish-card.tsx` `onClick` 调 `redeemWishAction({ wishId: w.id, shareToken: params.shareToken })`

### Task 4.3 — `adjustPointsAction`

- 接收 `childId: number, delta: number, reason: string, type: 'manual' | 'deduct'`
- 调 `.rpc('adjust_points', { p_child_id, p_delta, p_reason, p_type })`

### Task 4.4 — `useOptimisticPoints` 接入

**File**: `components/child/wish-card.tsx`

```ts
const apply = useOptimisticPoints(s => s.applyOverride);
const reconcile = useOptimisticPoints(s => s.reconcile);
const handleRedeem = () => {
  apply(child.id, -wish.targetPoints);
  startTransition(async () => {
    const r = await redeemWishAction({ wishId: wish.id, shareToken });
    if (r.ok) reconcile(child.id, r.data.remaining);
    else { reconcile(child.id, child.total_points); toast.error(r.error); }
  });
};
```

### Task 4.5 — 验证

**MUST RUN**:
- Dev 验证流程 6, 7, 8
- 并发测试:开两个浏览器 tab,同时 `approveTaskAction(同一 auditId)`,只一个成功
- 余额不足测试:孩子总积分 5, 兑换 10 分愿望 → 返 "积分不足"

**Commit**: `feat(atomic): approve/redeem/adjust via Postgres RPC`

---

## Phase 5 — 头像上传

**Goal**: admin children 列表 + 详情可上传头像,storage 持久化,UI 实时显示。

### Task 5.1 — `uploadAvatarAction`

```ts
export async function uploadAvatarAction(fd: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  const childId = Number(fd.get("childId"));
  const file = fd.get("file") as File | null;
  if (!file) return { ok: false, error: "未选择文件" };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "文件不能超过 2MB" };
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${childId}_${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('avatar').upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { ok: false, error: translateSupabaseError(upErr.message) };
  const { data: { publicUrl } } = supabase.storage.from('avatar').getPublicUrl(path);
  await supabase.from('children').update({ avatar_url: publicUrl }).eq('id', childId).eq('owner_id', user.id);
  revalidatePath("/admin/children");
  revalidatePath("/admin", "layout");  // 任务/愿望引用 children.name
  return { ok: true, data: { url: publicUrl } };
}
```

### Task 5.2 — UI 集成

**File**: `app/admin/children/children-client.tsx`

- `<input type="file" accept="image/*" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); fd.append('childId', String(child.id)); const r = await uploadAvatarAction(fd); ... }}>`
- 显示 `<img src={child.avatar_url ?? '/default-avatar.png'} />`
- 把 `<Avatar />` 组件(如有)同步

**MUST CHECK**:
- 实际到 Supabase Storage `avatar` bucket 看新文件
- RLS 限制:未登录用户上传应被拒(测一下)
- 验证 admin 端 + child 端(如果 child-shell 显示头像)同步显示

**Commit**: `feat(avatar): upload to Supabase Storage with size limit`

---

## Phase 6 — Zustand 3 store + URL hook

**Goal**: `useUiStore` 持久化 settings;`useToastQueue` 统一 toast;`useOptimisticPoints` 已接;`useRecordFilters` 替旧 store。

### Task 6.1 — `lib/stores/ui.ts`

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
type UiState = {
  globalTheme: "cafe" | "sky" | "coral" | "mint" | "lavender" | "sun";
  soundOpen: boolean;
  compactMode: boolean;
  setTheme: (t: UiState["globalTheme"]) => void;
  setSound: (b: boolean) => void;
  setCompact: (b: boolean) => void;
  hydrate: (s: { globalTheme: UiState["globalTheme"]; soundOpen: boolean; compactMode: boolean }) => void;
};
export const useUiStore = create<UiState>()(persist((set) => ({
  globalTheme: "cafe",
  soundOpen: true,
  compactMode: false,
  setTheme: (t) => set({ globalTheme: t }),
  setSound: (b) => set({ soundOpen: b }),
  setCompact: (b) => set({ compactMode: b }),
  hydrate: (s) => set(s),
}), { name: "rewards-ui" }));
```

### Task 6.2 — `lib/stores/toast-queue.ts`

(见 spec §4.2)

### Task 6.3 — `lib/stores/optimistic-points.ts`

(见 spec §4.3)

### Task 6.4 — `lib/hooks/use-record-filters.ts`

```ts
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
export type RecordFilters = { childId?: number; type?: "earn"|"deduct"|"manual"|"wish"|"task"; dateFrom?: string; dateTo?: string; };
export function useRecordFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const filters = useMemo<RecordFilters>(() => {
    const f: RecordFilters = {};
    const c = sp.get("childId"); if (c) f.childId = Number(c);
    const t = sp.get("type"); if (t) f.type = t as RecordFilters["type"];
    const df = sp.get("dateFrom"); if (df) f.dateFrom = df;
    const dt = sp.get("dateTo"); if (dt) f.dateTo = dt;
    return f;
  }, [sp]);
  const setFilter = useCallback((patch: Partial<RecordFilters>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => v ? p.set(k, String(v)) : p.delete(k));
    router.push(`/admin/records?${p.toString()}`);
  }, [sp, router]);
  return { filters, setFilter };
}
```

### Task 6.5 — 改写 `components/common/toast.tsx`

- 内部不再用 `useState<Toast[]>`,改用 `useToastQueue` 全局
- `useToast()` 钩子兼容老 API,内部委托 `useToastQueue.push()`

### Task 6.6 — `app/layout.tsx` 启动 hydrate

```ts
// app/layout.tsx (server)
import { getSettings } from "@/lib/queries";
import { UiHydrator } from "@/components/common/ui-hydrator";
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings().catch(() => null);  // 失败(null)用 localStorage 默认
  return (
    <html><body>
      <UiHydrator initial={s ? { globalTheme: s.globalTheme, soundOpen: s.soundOpen, compactMode: s.compactMode } : undefined} />
      {children}
    </body></html>
  );
}
```

`components/common/ui-hydrator.tsx`:`"use client"`,挂载时 `useUiStore.getState().hydrate(initial)`

### Task 6.7 — settings 页面改写

`app/admin/settings/settings-client.tsx` 改 `useTransition` + `updateSettingAction`,改 store:
```ts
const theme = useUiStore(s => s.globalTheme);
const setThemeStore = useUiStore(s => s.setTheme);
const handleTheme = (t) => startTransition(async () => {
  setThemeStore(t);  // optimistic
  const r = await updateSettingAction({ key: "globalTheme", value: t });
  if (!r.ok) { setThemeStore(prev); toast.error(r.error); }
});
```

### Task 6.8 — records 页面改写

`app/admin/records/records-client.tsx`:`const { filters, setFilter } = useRecordFilters();`;filters 变化时 `useEffect` 调 `getRecords(filters)` —— 但走 server,改用 link 跳转即可

**MUST RUN**:
- `npx tsc --noEmit` 0 错
- `npm run build` 0 错
- 验证 1:刷新 settings 页 → 主题保留
- 验证 2:换主题 → 立即 UI 变化(乐观)→ 后台 update → 刷新仍保留
- 验证 3:records 过滤后 URL 同步,直接 `?childId=1&type=earn` 打开复用过滤
- 验证 4:第二个浏览器开同一 URL,过滤一致

**Commit**: `feat(state): 3 Zustand stores + URL hook for filters`

---

## Phase 7 — 导出 / 备份 / 恢复 / 清理

**Goal**: settings 页面新增 4 个功能按钮,对应 4 个 server action。

### Task 7.1 — `exportRecordsAction(fd)`

```ts
export async function exportRecordsAction(fd: FormData): Promise<ActionResult<{ json: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  const { data, error } = await supabase.from("points_records").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { json: JSON.stringify({ exportedAt: new Date().toISOString(), records: data }, null, 2) } };
}
```

UI:点击 → 拿 `result.data.json` → 触发 `<a download={`records-${Date.now()}.json`} href={`data:application/json,${encodeURIComponent(json)}`}>` 点击。

### Task 7.2 — `backupDataAction()`

```ts
export async function backupDataAction(): Promise<ActionResult<{ json: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  const tables = ["settings", "children", "tasks", "task_assignments", "task_audit", "wishes", "points_records"];
  const dump: Record<string, unknown[]> = {};
  for (const t of tables) {
    const { data } = await supabase.from(t).select("*").eq("owner_id", user.id);
    dump[t] = data ?? [];
  }
  return { ok: true, data: { json: JSON.stringify({ backupAt: new Date().toISOString(), dump }, null, 2) } };
}
```

UI:同 export,生成文件下载。

### Task 7.3 — `restoreDataAction(fd)`

接收 `file: File`:
```ts
export async function restoreDataAction(fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  const file = fd.get("file") as File | null;
  if (!file) return { ok: false, error: "未选择文件" };
  let parsed: { dump: Record<string, unknown[]> };
  try { parsed = JSON.parse(await file.text()); } catch { return { ok: false, error: "JSON 解析失败" }; }
  if (!parsed.dump) return { ok: false, error: "无效备份文件" };
  // 先删
  for (const t of ["points_records","task_audit","wishes","task_assignments","tasks","children"]) {
    await supabase.from(t).delete().eq("owner_id", user.id);
  }
  // 再插(skip settings,保留当前)
  for (const [t, rows] of Object.entries(parsed.dump)) {
    if (t === "settings") continue;
    if (!rows || rows.length === 0) continue;
    // 重置 owner_id 防御
    const cleaned = (rows as Array<Record<string, unknown>>).map(r => ({ ...r, owner_id: user.id }));
    await supabase.from(t).insert(cleaned);
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
```

### Task 7.4 — `clearAllDataAction()`

```ts
export async function clearAllDataAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };
  for (const t of ["points_records","task_audit","wishes","task_assignments","tasks","children"]) {
    await supabase.from(t).delete().eq("owner_id", user.id);
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
```

### Task 7.5 — UI 集成

`app/admin/settings/settings-client.tsx` 底部"数据管理"卡片:
- 「导出流水」按钮 → 触发 export
- 「备份数据」按钮 → 触发 backup
- 「恢复数据」`<input type="file" accept=".json">` → 触发 restore,**先 confirm("恢复将覆盖当前数据,确定?")**
- 「清空所有数据」按钮 → **三次 confirm**(输入 "确认清空" 字符串),调 clear

### Task 7.6 — 验证

- 备份 → 看到 6 表 JSON
- 清空 → 所有页面 0 数据
- 恢复 → 数据回来
- 导出流水 → records 全部记录

**Commit**: `feat(settings): export/backup/restore/clear actions`

---

## Phase 8 — 清理

**Goal**: 删 `lib/mock-data.ts`;改文档;全 phase 验证。

### Task 8.1 — 删 mock-data

**MUST CHECK**:
- `grep -rln "from.*mock-data" lib app components` → 0 行
- `grep -rln "import.*mock-data" .` → 0 行
- `rm lib/mock-data.ts`

### Task 8.2 — 文档更新

**Files**:
- `docs/prd.md` §8.4:进度标 100%(原来 0)
- `docs/data-architecture.md` §2.7:加"多租户"小节,描述 owner_id + share_token
- `AGENTS.md`:加 `lib/queries/` `lib/stores/` `lib/hooks/` `lib/utils/errors.ts` 到文件结构表

### Task 8.3 — 全验证

跑 14 步 dev 验证流程(见 spec §6.1)。`npm run build` + `npx tsc --noEmit` + `npm run lint` 全 0。

**Commit**: `chore(cleanup): drop mock-data + update docs`

---

## Out-of-scope (本轮不做)

- 4 位密码登录
- 单元 / E2E 测试
- Supabase Realtime
- 多语言 / 多时区
- 邮件通知
- Admin 多账号协作
- 任务自动重复
- 等级 / 勋章系统

---

## Rollback Plan

每 commit 都可独立 `git revert` 回到 mock-data 模式。若 migration 1 之后想回滚,先 `MCP:apply_migration` 反向 SQL(已在 spec §5.1 注释;实际可不写,revert commit 后旧字段会重新创建)。
