# Supabase 数据层全量接入 — Design Spec

> **状态**: Draft,待 user review  
> **日期**: 2026-06-03  
> **作者**: opencode (co-designed with allen)  
> **范围**: 把 9 个页面(landing + 6 admin + 3 child)从 `lib/mock-data.ts` 静态数据 + 内存 mutation 全部切换到 Supabase Postgres + Storage;新增 14 个待补 server action;引入多租户隔离(`owner_id` + `auth.uid()`);新增 3 个 Zustand store + 1 URL hook;3 个 RPC 函数保证原子事务。

---

## 1. 总览

### 1.1 目标

1. **真数据**:9 个页面全部读 Supabase 7 张表(已 seed,见 `docs/database-schema.sql`)。
2. **真写**:24 个 server action 全部实装,10 个现有 + 14 个待补。
3. **多租户隔离**:每个 Supabase Auth 账号 = 1 个家庭,数据严格隔离。
4. **公开分享**:孩子端 `/child/[shareToken]` 用不可枚举 UUID token,RLS 允许 anon 按 token 读。
5. **原子事务**:审核 / 兑换 / 加减分走 Postgres RPC 函数,事务内完成多表变更。
6. **客户端状态**:3 个 Zustand store(UI 偏好 / Toast 队列 / 乐观积分)+ 1 URL hook(过滤器)管跨组件状态。
7. **头像上传**:Supabase Storage `avatar` bucket(已建),authenticated 上传 + 公开读。

### 1.2 已定决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 鉴权 | `anon + RLS`,不用 service_role | 单 Supabase Auth 账号 = 1 家庭;RLS 策略由 `owner_id = auth.uid()` 强制 |
| 状态管理 | 3 个 Zustand store(UI / Toast / Optimistic)+ 1 URL hook(filters) | 跨组件 / 跨页;读路径仍走 RSC |
| 原子事务 | 3 个 RPC 函数(`approve_task` / `redeem_wish` / `adjust_points`) | server action 调一次,事务由 Postgres 保障 |
| Realtime | 不上 | 1 个 admin 看页;`revalidatePath` + 手动刷新足够 |
| URL vs store | 过滤器用 URL search params | 刷新可保留 / 可分享 / 可书签 |
| Seed | 去掉,新用户 onboarding 自建 | `on_auth_user_created` trigger 自动建 settings 行;其他表 UI 自行添加 |
| 文件上传 | `supabase.storage.from('avatar').upload()` | 已有 bucket + RLS;upsert 覆盖同名 |

### 1.3 非目标(明确不做)

- 4 位密码登录(PRD §8.1 暂缓)
- 多语言 / 多时区(用 `date-fns` + 亚洲/上海时区)
- 邮件通知(Supabase email 后加)
- 第三方登录 / SSO
- 移动端 PWA / 离线
- 孩子端注册(孩子无登录,凭 share_token 公开访问)
- Admin 多账号协作(同 owner 单 session)
- BI 看板 / 等级自动计算
- 任务自动重复(daily/weekly 不自动生成 audit)
- 单元 / E2E 测试(YAGNI,改用 dev 验证 checklist)

---

## 2. 架构

### 2.1 分层

```
┌────────────────────────────────────────────────────┐
│ Browser                                             │
│                                                      │
│  Pages (RSC)        Client components                │
│  ──────────         ────────────────                │
│  page.tsx           *-client.tsx                    │
│  (server)           (useState/useTransition)         │
│      │                   │                           │
│      │ await             │ form action               │
│      ▼                   ▼                           │
│  ┌──────────────┐   ┌──────────────┐                │
│  │ lib/queries/ │   │ lib/actions/ │                │
│  │ (server fns) │   │ (server fns) │                │
│  └──────┬───────┘   └──────┬───────┘                │
│         │                  │                         │
│         │   Zustand stores (client only)             │
│         │   ────────────────────────                │
│         │   useUiStore / useToastQueue /            │
│         │   useOptimisticPoints /                    │
│         │   (useRecordFilters → URL search params)  │
│         │                                            │
└─────────┼──────────────────┼─────────────────────────┘
          │                  │
          ▼                  ▼
   ┌─────────────────────────────────┐
   │  lib/supabase/server.ts          │
   │  (createServerClient + cookies)  │
   │  → Supabase Postgres + Storage  │
   └─────────────────────────────────┘
                    │
                    ▼
   ┌─────────────────────────────────┐
   │  RLS policies enforce access    │
   │  owner_id = auth.uid()          │
   │  + 3 RPC for atomic             │
   │  + anon share_token read        │
   └─────────────────────────────────┘
```

### 2.2 核心约定

1. **页面 = Server Component**(默认),`await` 调 queries,数据 props 透传给 client 组件。
2. **Client 组件**只管交互态(表单 / 弹窗 / tab / 编辑中),不直接调 Supabase。
3. **Server actions 统一入口**:`lib/actions.ts` `"use server"` 顶部,所有 mutation 走它。
4. **Server action 第一行**:`const supabase = await createClient()` + `const { data: { user } } = await supabase.auth.getUser()`;无 user → return `{ ok: false, error: "未登录" }`。
5. **Zustand 3 store + 1 URL hook**,只在 client 边界,Server Component 不能读 store。
6. **错误**:`ActionResult = { ok: true; data? } | { ok: false; error: string }`,client `useTransition` + `toast.error(translate(error))`。
7. **缓存失效**:每个写 action 结尾 `revalidatePath` 它影响到的所有路由。
8. **类型**:`lib/database.types.ts` 由 `supabase_generate_typescript_types` 生成,queries / actions 全部用此类型,**禁用 `any`**。
9. **DB → UI 类型映射**:`db_snake_case` → `ui_camelCase` 在 query 内部 `.map()` 完成,组件不感知 DB 列名。

### 2.3 文件结构

```
lib/
  queries/
    settings.ts            # getSettings(), updateSettings()
    children.ts            # getChildren(), getChildById(), getChildByShareToken()
    tasks.ts               # getTasksForAdmin(), getTasksForChild(token)
    task-audit.ts          # getPendingAudits(), getAuditsForChild()
    wishes.ts              # getWishesForAdmin(), getWishesForChild(token)
    points-records.ts      # getRecords(filters), getRecordSummary()
    dashboard.ts           # getDashboardStats(), getChildSummaries()
    index.ts               # barrel
  actions.ts               # 24 server actions,全部重写
  stores/
    ui.ts                  # useUiStore
    toast-queue.ts         # useToastQueue
    optimistic-points.ts   # useOptimisticPoints
    index.ts               # barrel
  hooks/
    use-record-filters.ts  # URL search params
  utils/
    errors.ts              # translateSupabaseError()
  database.types.ts        # supabase generate
  supabase/
    client.ts              # existing
    server.ts              # existing
    proxy.ts               # existing
  ui-presets.ts            # themePresets / adminColorPresets / iconPresets
  mock-data.ts             # ❌ 删除(Phase 8)
```

### 2.4 Zustand 边界

| Store | 谁读 | 谁写 | 持久化 |
|---|---|---|---|
| `useUiStore` | 全 client 组件 | settings 控件 → server action → setState | localStorage + 启动时 DB hydrate |
| `useToastQueue` | ToastProvider | `useToast()` 调用 | 进程内 |
| `useOptimisticPoints` | child wishes / home | server action reconcile | 进程内,刷新重算 |
| `useRecordFilters` | records 页 | URL search params | URL |

**不创建的 store**:`useAuthStore`(cookies)、`useChildStore`(URL)、`useFormStore`(modal local)、`useRealtimeStore`(不上 realtime)。

---

## 3. 数据层

### 3.1 Queries 签名

```ts
// lib/queries/settings.ts
export async function getSettings(): Promise<Settings>;
export async function updateSettings(patch: Partial<Settings>): Promise<void>;

// lib/queries/children.ts
export async function getChildren(): Promise<Child[]>;                     // 当前 owner 的全部
export async function getChildById(id: number): Promise<Child | null>;
export async function getChildByShareToken(token: string): Promise<Child | null>;  // anon 也能查
export async function createChild(input: NewChild): Promise<Child>;
export async function updateChild(id: number, patch: Partial<NewChild>): Promise<Child>;
export async function deleteChild(id: number): Promise<void>;

// lib/queries/tasks.ts
export async function getTasksForAdmin(): Promise<TaskWithAssignments[]>;
export async function getTasksForChild(shareToken: string): Promise<ChildTask[]>;
export async function getTaskById(id: number): Promise<Task | null>;
export async function createTask(input: NewTask): Promise<Task>;
export async function updateTask(id: number, patch: Partial<NewTask>): Promise<Task>;
export async function closeTask(id: number, reason: string): Promise<void>;
export async function restoreTask(id: number): Promise<void>;

// lib/queries/task-audit.ts
export async function getPendingAudits(limit?: number): Promise<AuditWithJoins[]>;
export async function getAuditsForChild(shareToken: string, filter?: "pending" | "done" | "all"): Promise<AuditWithJoins[]>;
export async function submitTask(input: { taskId: number; shareToken: string }): Promise<Audit>;

// lib/queries/wishes.ts
export async function getWishesForAdmin(): Promise<WishRow[]>;
export async function getWishesForChild(shareToken: string): Promise<WishWithProgress[]>;
export async function createWish(input: NewWish): Promise<Wish>;
export async function updateWish(id: number, patch: Partial<NewWish>): Promise<Wish>;
export async function lockWish(id: number, isLock: boolean): Promise<void>;
export async function deleteWish(id: number): Promise<void>;

// lib/queries/points-records.ts
export async function getRecords(filters: RecordFilters): Promise<PointsRecordRow[]>;
export async function getRecordSummary(childId?: number, monthFrom?: Date): Promise<{monthEarn:number;monthDeduct:number;netAdd:number}>;
export async function exportRecordsAsJson(filters: RecordFilters): Promise<string>;

// lib/queries/dashboard.ts
export async function getDashboardStats(): Promise<DashboardStats>;     // 包装 v_dashboard_stats
export async function getChildSummaries(): Promise<ChildSummaryRow[]>;  // 包装 v_child_summary
export async function getWishProgress(wishId: number): Promise<WishProgress>;

// lib/queries/storage.ts
export async function uploadAvatar(childId: number, file: File): Promise<string>;
export async function getAvatarUrl(path: string): Promise<string>;
```

### 3.2 类型映射

每个 query 内部做 `db_snake_case → ui_camelCase`,把 JOIN 展平为 UI 用结构:

```ts
// 示例:tasks query
type TaskWithAssignments = {
  id: number;
  name: string;
  icon: string;
  iconBg: string;       // 派生 from icon 字符 → 哈希色
  iconColor: string;
  points: number;
  cycle: "daily" | "weekly" | "once";
  status: "active" | "closed";
  closedReason: string | null;
  assignedChildren: number[];  // 从 task_assignments JOIN
  createdAt: string;
  updatedAt: string;
};
```

### 3.3 Server Actions 24 个

| # | Action | 副作用 | RPC? |
|---|---|---|---|
| 1 | `addTaskAction(fd)` | INSERT tasks + task_assignments | no |
| 2 | `updateTaskAction(fd)` | UPDATE tasks + diff task_assignments | no |
| 3 | `closeTaskAction(fd)` | UPDATE tasks SET status=false, closed_reason=? | no |
| 4 | `restoreTaskAction(fd)` | UPDATE tasks SET status=true, closed_reason=NULL | no |
| 5 | `submitTaskAction(fd)` | INSERT task_audit(status=pending) | no |
| 6 | `approveTaskAction(fd)` | 事务:audit agree + child +delta + record earn | **yes** |
| 7 | `rejectTaskAction(fd)` | UPDATE task_audit status=refuse | no |
| 8 | `addWishAction(fd)` | INSERT wishes | no |
| 9 | `updateWishAction(fd)` | UPDATE wishes | no |
| 10 | `lockWishAction(fd)` | UPDATE wishes SET is_lock=? | no |
| 11 | `deleteWishAction(fd)` | DELETE wishes | no |
| 12 | `redeemWishAction(fd)` | 事务:校验余额 + child -delta + wish finish + record wish | **yes** |
| 13 | `addChildAction(fd)` | INSERT children | no |
| 14 | `updateChildAction(fd)` | UPDATE children | no |
| 15 | `deleteChildAction(fd)` | DELETE children (CASCADE) | no |
| 16 | `uploadAvatarAction(fd)` | storage upload + UPDATE avatar_url | no |
| 17 | `adjustPointsAction(fd)` | 事务:校验 + child ±delta + record manual/deduct | **yes** |
| 18 | `exportRecordsAction(fd)` | SELECT → JSON | no |
| 19 | `changePasswordAction(fd)` | UPDATE settings SET admin_pwd=? | no |
| 20 | `setSecurityQuestionAction(fd)` | UPDATE settings security_q/a | no |
| 21 | `updateSettingAction(fd)` | UPDATE settings SET <key>=? (theme/sound/compact) | no |
| 22 | `backupDataAction()` | SELECT 6 表 → JSON | no |
| 23 | `restoreDataAction(fd)` | 事务 TRUNCATE + INSERT | no |
| 24 | `clearAllDataAction()` | TRUNCATE 5 表 owner data,保留 settings | no |

**统一返回类型**:
```ts
type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };
```

### 3.4 3 个 RPC 函数

```sql
create function approve_task(p_audit_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_audit task_audit%rowtype;
  v_task_points int;
  v_owner uuid;
begin
  select * into v_audit from task_audit
    where id = p_audit_id and owner_id = auth.uid() for update;
  if not found then raise exception 'audit not found or not owned'; end if;
  if v_audit.audit_status != 'pending' then raise exception 'audit not pending'; end if;
  v_owner := v_audit.owner_id;
  select points into v_task_points from tasks where id = v_audit.task_id and owner_id = v_owner;
  update task_audit set audit_status = 'agree', audit_time = now() where id = p_audit_id;
  update children set total_points = total_points + v_task_points
    where id = v_audit.child_id and owner_id = v_owner;
  insert into points_records (owner_id, child_id, related_id, record_type, points, remark)
    values (v_owner, v_audit.child_id, p_audit_id, 'earn', v_task_points, '任务奖励');
  return jsonb_build_object('ok', true, 'points', v_task_points);
end; $$;

create function redeem_wish(p_share_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_wish wishes%rowtype;
  v_child children%rowtype;
begin
  select w.* into v_wish from wishes w
    join children c on c.id = w.child_id
    where c.share_token = p_share_token for update;
  if not found then raise exception 'wish not found'; end if;
  if v_wish.is_lock or v_wish.is_finish then raise exception 'wish not redeemable'; end if;
  select * into v_child from children where id = v_wish.child_id for update;
  if v_child.total_points < v_wish.target_points then
    raise exception 'insufficient points';
  end if;
  update children set total_points = total_points - v_wish.target_points where id = v_child.id;
  update wishes set is_finish = true where id = v_wish.id;
  insert into points_records (owner_id, child_id, related_id, record_type, points, remark)
    values (v_child.owner_id, v_child.id, v_wish.id, 'wish', -v_wish.target_points, '兑换:' || v_wish.name);
  return jsonb_build_object('ok', true, 'remaining', v_child.total_points - v_wish.target_points);
end; $$;

create function adjust_points(p_child_id bigint, p_delta int, p_reason text, p_type text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_child children%rowtype;
  v_signed_delta int;
begin
  select * into v_child from children
    where id = p_child_id and owner_id = auth.uid() for update;
  if not found then raise exception 'child not found or not owned'; end if;
  v_signed_delta := case when p_type = 'deduct' then -p_delta else p_delta end;
  if v_signed_delta < 0 and v_child.total_points < abs(v_signed_delta) then
    raise exception 'insufficient points for deduct';
  end if;
  update children set total_points = total_points + v_signed_delta where id = p_child_id;
  insert into points_records (owner_id, child_id, record_type, points, remark)
    values (v_child.owner_id, p_child_id, p_type, v_signed_delta, p_reason);
  return jsonb_build_object('ok', true, 'new_total', v_child.total_points + v_signed_delta);
end; $$;
```

**关键点**:
- `security definer`:让 RPC 用 owner 权限执行(可写跨表),但函数体内**显式** `WHERE owner_id = auth.uid()` 校验,不靠 RLS。
- `for update`:行锁防并发双花。
- 入参:`redeem_wish` 用 `share_token` 而非 `wish_id`,让 anon 端能凭 token 调。

### 3.5 错误处理

```ts
// lib/utils/errors.ts
const ERROR_MAP: Record<string, string> = {
  "insufficient points": "积分不足",
  "insufficient points for deduct": "积分不足,无法扣分",
  "audit not pending": "该任务已审核,无法重复操作",
  "audit not found or not owned": "任务不存在或无权限",
  "wish not redeemable": "该愿望已锁定或已兑换",
  "wish not found": "愿望不存在",
  "child not found or not owned": "孩子不存在或无权限",
};
export function translateSupabaseError(msg: string): string {
  return ERROR_MAP[msg] ?? msg;
}
```

每个 client 调用点 `toast.error(translateSupabaseError(result.error))`。

---

## 4. Zustand 3 Store + 1 URL Hook

### 4.1 `useUiStore`

```ts
type UiState = {
  globalTheme: "cafe" | "sky" | "coral" | "mint" | "lavender" | "sun";
  soundOpen: boolean;
  compactMode: boolean;
  setTheme: (t: UiState["globalTheme"]) => void;        // 调 updateSettingAction
  setSound: (b: boolean) => void;
  setCompact: (b: boolean) => void;
  hydrate: () => Promise<void>;                          // 启动时从 settings 拉
};
```

- 持久化:Zustand `persist` → localStorage(只存 3 个字段)
- 启动:`app/layout.tsx` `useEffect` 调 `hydrate()`
- 写入单向:server action → `useUiStore.setState(...)`

### 4.2 `useToastQueue`

```ts
type ToastEntry = { id: string; message: string; variant: "success"|"error"|"info"; createdAt: number };
type ToastState = {
  queue: ToastEntry[];
  push: (t: Omit<ToastEntry, "id"|"createdAt">) => void;
  dismiss: (id: string) => void;
};
```

- 替换 `components/common/toast.tsx` 内部 `useState<Toast[]>`
- 老的 `useToast()` API 兼容,内部委托 `useToastQueue.push()`
- 持久化:无(进程内)

### 4.3 `useOptimisticPoints`

```ts
type OptState = {
  overrides: Record<number, number>;                     // childId → 显示用积分
  applyOverride: (childId: number, delta: number) => void;
  reconcile: (childId: number, real: number) => void;
  clear: (childId: number) => void;
};
```

- 用法:child 兑换 → `applyOverride(childId, -cost)` → server action 完成 → `reconcile(childId, real)`
- 失败时反向 `applyOverride` 或 `reconcile` 回原值

### 4.4 过滤器 → URL search params

```ts
// lib/hooks/use-record-filters.ts
export function useRecordFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const setFilter = useCallback(
    (patch: Partial<RecordFilters>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
      router.push(`/admin/records?${params}`);
    },
    [searchParams, router]
  );
  return { filters, setFilter };
}
```

- 刷新 / 分享 / 书签 URL 都保留状态
- 之前方案说"不推荐上 URL"是错的,URL 才是最佳实践

---

## 5. Schema 变更 + 多租户

### 5.1 Migration 1:多租户字段

```sql
-- TRUNCATE 所有数据(因 settings PK 改)
TRUNCATE public.points_records, public.task_audit, public.wishes,
         public.task_assignments, public.tasks, public.children,
         public.settings CASCADE;

-- children: 加 owner_id + share_token
ALTER TABLE public.children
  ADD COLUMN owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN share_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE INDEX idx_children_owner ON public.children(owner_id);
CREATE INDEX idx_children_share_token ON public.children(share_token);

-- tasks / task_audit / wishes / points_records 加 owner_id
ALTER TABLE public.tasks ADD COLUMN owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_tasks_owner ON public.tasks(owner_id);

ALTER TABLE public.task_audit ADD COLUMN owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_task_audit_owner ON public.task_audit(owner_id);

ALTER TABLE public.wishes ADD COLUMN owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_wishes_owner ON public.wishes(owner_id);

ALTER TABLE public.points_records ADD COLUMN owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_points_records_owner ON public.points_records(owner_id);

-- settings: 改 PK
ALTER TABLE public.settings DROP CONSTRAINT settings_single_row;
ALTER TABLE public.settings DROP CONSTRAINT settings_pkey;
ALTER TABLE public.settings ADD PRIMARY KEY (owner_id);
ALTER TABLE public.settings ADD CONSTRAINT settings_owner_fk
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 补字段
ALTER TABLE public.tasks ADD COLUMN closed_reason text NULL;
ALTER TABLE public.settings ADD COLUMN compact_mode boolean NOT NULL DEFAULT false;

-- 新用户 trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.settings (owner_id, admin_pwd) VALUES (NEW.id, '0000');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.2 Migration 2:RPC 函数

(见 §3.4,集中放一个 migration)

### 5.3 Migration 3:重写 RLS + share_token anon 读

```sql
-- 清旧
DROP POLICY IF EXISTS settings_all ON public.settings;
DROP POLICY IF EXISTS children_read ON public.children;
DROP POLICY IF EXISTS children_write ON public.children;
DROP POLICY IF EXISTS tasks_read ON public.tasks;
DROP POLICY IF EXISTS tasks_write ON public.tasks;
DROP POLICY IF EXISTS assignments_read ON public.task_assignments;
DROP POLICY IF EXISTS assignments_write ON public.task_assignments;
DROP POLICY IF EXISTS audit_read ON public.task_audit;
DROP POLICY IF EXISTS audit_create ON public.task_audit;
DROP POLICY IF EXISTS audit_update ON public.task_audit;
DROP POLICY IF EXISTS wishes_read ON public.wishes;
DROP POLICY IF EXISTS wishes_write ON public.wishes;
DROP POLICY IF EXISTS records_read ON public.points_records;
DROP POLICY IF EXISTS records_write ON public.points_records;

-- settings: 仅 owner
CREATE POLICY settings_owner_all ON public.settings
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- children: owner 全部 + anon 凭 share_token 查
CREATE POLICY children_owner_all ON public.children
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY children_anon_share_read ON public.children
  FOR SELECT TO anon USING (share_token IS NOT NULL);

-- tasks / task_assignments / task_audit / wishes / points_records: owner 限定
CREATE POLICY tasks_owner_all ON public.tasks
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY assignments_owner_all ON public.task_assignments
  FOR ALL TO authenticated
  USING (
    task_id IN (SELECT id FROM public.tasks WHERE owner_id = auth.uid())
    AND child_id IN (SELECT id FROM public.children WHERE owner_id = auth.uid())
  ) WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE owner_id = auth.uid())
    AND child_id IN (SELECT id FROM public.children WHERE owner_id = auth.uid())
  );

CREATE POLICY audit_owner_all ON public.task_audit
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY wishes_owner_all ON public.wishes
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY records_owner_all ON public.points_records
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- tasks / assignments / audit / wishes: anon 凭 share_token child 读
CREATE POLICY tasks_anon_share_read ON public.tasks
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.task_assignments ta
            JOIN public.children c ON c.id = ta.child_id
            WHERE ta.task_id = public.tasks.id AND c.share_token IS NOT NULL)
  );

CREATE POLICY assignments_anon_share_read ON public.task_assignments
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.children c
            WHERE c.id = public.task_assignments.child_id AND c.share_token IS NOT NULL)
  );

CREATE POLICY audit_anon_share_read ON public.task_audit
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.children c
            WHERE c.id = public.task_audit.child_id AND c.share_token IS NOT NULL)
  );

CREATE POLICY wishes_anon_share_read ON public.wishes
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.children c
            WHERE c.id = public.wishes.child_id AND c.share_token IS NOT NULL)
  );

CREATE POLICY audit_anon_insert ON public.task_audit
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.children c
            WHERE c.id = task_audit.child_id AND c.share_token IS NOT NULL)
  );
```

### 5.4 Storage RLS 复核

现有 `avatar` bucket policy:
- public read ✓
- authenticated write ✓
- authenticated update ✓
- authenticated delete ✓

无需新增。

### 5.5 Seed 数据

去掉所有 seed。Migration 1 第一行 `TRUNCATE ... CASCADE` 清空。新用户靠 `on_auth_user_created` trigger 自动建 settings 行,其他表靠 UI 自行添加。

### 5.6 URL 变更

`/child/[childId]/*` → `/child/[shareToken]/*`:
- `app/child/[childId]/*` 重命名为 `app/child/[shareToken]/*`
- `lib/queries/children.ts` `getChildById` → `getChildByShareToken(token: string)`
- `app/admin/children/children-client.tsx` 加「复制分享链接」按钮:`navigator.clipboard.writeText(`${origin}/child/${child.share_token}`)`
- 旧 `childId` 数字 ID 在前端 UI 仍可见(用 `child.id`),仅 URL 路径用 token

### 5.7 类型生成

```bash
# migration 跑完后立即跑,生成 lib/database.types.ts
npx supabase gen types typescript --linked > lib/database.types.ts
```

或用 MCP 工具 `supabase_generate_typescript_types`(已在 `.opencode` 环境可用)。

---

## 6. 实装分阶段(8 commits)

| Phase | 内容 | 文件数 | 验证 |
|---|---|---|---|
| 1 | 跑 migration 1+2+3 + 生成 types + 新建 queries/stores/hooks/utils 骨架 | ~15 新 | tsc / Supabase 后台 SELECT 验 schema |
| 2 | 读路径:9 页全部接 query,删 mock import;URL 改 [shareToken] | ~22 改 | 每页打开看真数据;typecheck/lint/build |
| 3 | 写路径:12 个非原子 action | 1 改 lib/actions.ts + 7 改 client | 每个 CRUD 跑通;Supabase 后台验写入 |
| 4 | 原子 3 个 action via RPC | 1 改 + 3 调用点 | 积分不足返错;事务一致 |
| 5 | 头像上传 | 1 新 + 2 改 | storage 看文件 + 卡片显示 |
| 6 | Zustand 3 store + URL hook | 3 store + 1 hook + 4 改 | 刷新 settings 保留;兑换乐观;records URL 同步 |
| 7 | 导出/备份/恢复/清理 | 4 改 lib/actions.ts + 1 改 settings | 导出 JSON 正确;备份→清空→恢复数据回 |
| 8 | 清理:删 mock-data + 改文档 | 1 删 + 3 文档 | `grep -r mock-data` 0;全 phase 验证流程通过 |

### 6.1 Dev 验证流程(每 phase + 最终)

1. 注册新账号 → 验证 trigger 自动建 settings
2. `/admin` → 新增孩子 → Supabase 后台看
3. admin 复制 share_token URL → 另一浏览器开 → 看到该孩子
4. `/admin` → 新增任务 + 分配
5. 孩子端 → 提交任务
6. `/admin` → 通过 → 验证积分 + record
7. `/admin` → 兑换愿望 → 验证积分 -record
8. `/admin` → 手动加减分
9. `/admin` → 关闭 / 恢复任务
10. `/admin` → 锁定 / 删除愿望
11. `/admin` → 上传头像
12. `/admin` → 导出流水
13. `/admin` → 备份 → 清空 → 恢复
14. 第二个账号注册 → 验证 0 可见数据

---

## 7. 风险登记

| # | 风险 | 影响 | 应对 |
|---|---|---|---|
| R1 | migration 1 TRUNCATE + ALTER 顺序错导致 settings PK 改失败 | 数据破坏 | SQL Editor 单步跑,每步 SELECT COUNT(*) 验 |
| R2 | RLS policy 漏导致跨用户读 | 安全漏洞 | 每 phase 跑第二个账号注册 + 验证 0 可见 |
| R3 | RPC `security definer` 绕过 RLS | 逻辑漏洞 | RPC 内显式 `WHERE owner_id = auth.uid()` 校验 |
| R4 | 头像上传文件名冲突 | 覆盖错误文件 | `childId + '_' + Date.now() + ext` |
| R5 | wish 兑换不原子 | 双重扣分 | 全部走 RPC,client 不直接 .update() |
| R6 | `/child/[shareToken]` 被搜索引擎索引 | token 泄露 | child 端 layout 加 `<meta name="robots" content="noindex">` |
| R7 | 删孩子 CASCADE 删所有数据 | 不可逆 | `deleteChildAction` 前 `SELECT COUNT(*)` 关联,UI 二次确认 |
| R8 | 类型生成漏表 → `any` | 类型漏洞 | migration 后必跑 gen types;CI 禁 `any` |
| R9 | `useUiStore` 双向同步冲突 | 设置错乱 | hydrate 后只读,改动走 server action → setState 单向 |
| R10 | RLS EXISTS 子查询性能 | 列表查询慢 | `owner_id` / `share_token` 索引已加;EXISTS 命中 index |

---

## 8. 验收标准

- 8 个 phase commit 全部合入 main
- 14 个 dev 验证流程全过
- `grep -r "mock-data" lib/ app/ components/` 返回空
- `npm run build` + `npx tsc --noEmit` + `npm run lint` 全 0 错
- 第二个测试账号注册后看到空 admin(零其他用户数据)
- RPC `approve_task` 模拟并发:同一 audit 两次调用,只有一次成功
- `/admin/records` 过滤器 URL 同步:`/admin/records?childId=1&type=earn` 直接打开能复用过滤

---

## 9. 后续轮次(明确不在本轮)

- 4 位密码登录(PRD §8.1)
- 多语言 / 多时区
- Supabase Realtime 订阅 dashboard
- 单元 / E2E 测试
- 孩子端注册 + 多端同步
- Admin 多账号协作
- 等级自动计算 + 勋章系统
- 任务自动重复规则
- 邮件通知
