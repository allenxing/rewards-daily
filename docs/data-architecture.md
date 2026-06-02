# 数据架构 — 页面、API、数据库总览

> 本文档是 V1.0 落地的"数据手册",把 PRD 需求 → 当前页面 → 需要的服务端接口 → 数据库结构一次性串起来。
> 配套文件:
> - [api-spec.md](./api-spec.md) — 每条 server action 的签名、输入、RLS、状态
> - [database-schema.sql](./database-schema.sql) — Supabase 可直接执行的 DDL
> - [prd.md](./prd.md) §5 — PRD 原始表结构
> - [implementation-plan.md](./implementation-plan.md) — 实施进度

---

## 0. 一句话总结

**7 张表**(PRD 6 张 + 1 张补的 `task_assignments`)+ 1 个 storage 桶 + 24 个 server action(已实现 10 / 待实现 14),覆盖 9 个页面(1 landing + 6 admin + 3 child - 1 admin shell 共用)。

---

## 1. 页面 × 数据 矩阵

### 1.1 公开页

| 页面 | 路由 | 读 | 写 | 鉴权 |
|---|---|---|---|---|
| 落地页 | `/` | — | — | 公开 |

### 1.2 家长端(`/admin/*`)

| 页面 | 路由 | 读取的数据 | 触发的操作 |
|---|---|---|---|
| **控制台首页** | `/admin` | `v_dashboard_stats`(4 数) / `task_audit` (status=pending, limit 3) / `children`(select 2) | approveTask / rejectTask / adjustPoints(FAB) |
| **任务管理** | `/admin/tasks` | `tasks` + `task_assignments` JOIN / `children` | addTask / updateTask / closeTask / **restoreTask** |
| **愿望管理** | `/admin/wishes` | `wishes` / `children` | addWish / updateWish / **lockWish** / **deleteWish** |
| **孩子管理** | `/admin/children` | `children` | addChild / updateChild / **deleteChild** / **uploadAvatar** |
| **积分流水** | `/admin/records` | `points_records` (filter: child/type/date) / `v_points_summary` (本月) / `children` | **exportRecords**(JSON 下载) |
| **系统设置** | `/admin/settings` | `settings` (单行) | **changePassword** / **setSecurityQuestion** / **updateSetting**(theme/sound) / **backupData** / **restoreData** / **clearAllData** |

> 加粗 = 尚未在 `lib/actions.ts` 实现

### 1.3 孩子端(`/child/[childId]/*`)

| 页面 | 路由 | 读取的数据 | 触发的操作 |
|---|---|---|---|
| **我的首页** | `/child/[childId]` | `children` / `task_audit` (status=pending or agree today) / `v_wish_progress` (own + family) | submitTask |
| **任务大厅** | `/child/[childId]/tasks` | `tasks` JOIN `task_assignments` WHERE child_id / `task_audit` WHERE child_id | submitTask |
| **梦想宝库** | `/child/[childId]/wishes` | `v_wish_progress` / redeem history(由 `points_records` type=wish 派生) | redeemWish |

---

## 2. 服务端 API 全清单

> 实现层是 Next.js **server actions**(`lib/actions.ts`),不暴露 REST/RPC。前端通过 `import { ... } from "@/lib/actions"` 调用,浏览器走 Next 内置的 POST 通道。
> 完整签名/输入/RLS 状态见 [api-spec.md](./api-spec.md)。

### 2.1 任务域(`tasks` / `task_audit` / `task_assignments`)

| Action | 状态 | 调用方 |
|---|---|---|
| `addTaskAction(formData)` | ✅ 已实现 | `/admin/tasks` 新增按钮 |
| `updateTaskAction(formData)` | ✅ 已实现 | `/admin/tasks` 编辑按钮 |
| `closeTaskAction(formData)` | ✅ 已实现 | `/admin/tasks` 关闭按钮 |
| `restoreTaskAction(taskId)` | ❌ 待实现 | `/admin/tasks` "恢复启用" 按钮 |
| `submitTaskAction(taskId)` | ✅ 已实现 | `/child/[childId]` + `/child/[childId]/tasks` |
| `approveTaskAction(auditId)` | ❌ 待实现 | `/admin` "通过" 按钮 |
| `rejectTaskAction(auditId, reason?)` | ❌ 待实现 | `/admin` "拒绝" 按钮 |

### 2.2 愿望域(`wishes` / `points_records`)

| Action | 状态 | 调用方 |
|---|---|---|
| `addWishAction(formData)` | ✅ 已实现 | `/admin/wishes` 新增按钮 |
| `updateWishAction(formData)` | ✅ 已实现 | `/admin/wishes` 编辑按钮 |
| `lockWishAction(wishId, isLock)` | ❌ 待实现 | `/admin/wishes` "锁定" 按钮 |
| `deleteWishAction(wishId)` | ❌ 待实现 | `/admin/wishes` 🗑 按钮 |
| `redeemWishAction(wishId, childId)` | ✅ 已实现 | `/child/[childId]/wishes` 兑换按钮 |

### 2.3 孩子域(`children` + `storage.objects`)

| Action | 状态 | 调用方 |
|---|---|---|
| `addChildAction(formData)` | ✅ 已实现 | `/admin/children` 新增按钮 |
| `updateChildAction(formData)` | ✅ 已实现 | `/admin/children` 编辑按钮 |
| `deleteChildAction(childId)` | ❌ 待实现 | `/admin/children` 🗑 按钮 |
| `uploadAvatarAction(childId, file)` | ❌ 待实现 | `/admin/children` 头像上传 |

### 2.4 积分流水域(`points_records`)

| Action | 状态 | 调用方 |
|---|---|---|
| `adjustPointsAction(formData)` | ✅ 已实现 | `/admin` FAB +/− |
| `exportRecordsAction(filters)` | ❌ 待实现 | `/admin/records` "导出数据" 按钮 |

### 2.5 设置域(`settings`)

| Action | 状态 | 调用方 |
|---|---|---|
| `changePasswordAction(currentPwd, newPwd)` | ❌ 待实现 | `/admin/settings` "修改密码" 模态 |
| `setSecurityQuestionAction(question, answer)` | ❌ 待实现 | `/admin/settings` "设置密保" 模态 |
| `updateSettingAction(key, value)` | ❌ 待实现 | `/admin/settings` 主题色 / 音效 / 紧凑模式 toggle |
| `backupDataAction()` | ❌ 待实现 | `/admin/settings` "立即备份" |
| `restoreDataAction(json)` | ❌ 待实现 | `/admin/settings` "选择文件" |
| `clearAllDataAction()` | ❌ 待实现 | `/admin/settings` "清空数据" |

### 2.6 鉴权域(`settings.admin_pwd` + cookie session)

> PRD §8.1 已记录:V1.0 目标态是 4 位密码登录;**第十轮(2026-06-02)用户显式决定沿用 Supabase Auth**,4 位密码切换延后。  
> Landing 登录/注册 modal(`AuthModal`)已实装,内部调 `supabase.auth.signInWithPassword` / `signUp`,不直接走 settings 表。  
> `settings.admin_pwd` 字段(PRD §5.3)在 Supabase 已 seed `'1234'`,但前端未消费 — 等 4 位密码切换时再用。

| Action | 状态 | 调用方 |
|---|---|---|
| `loginWithPasswordAction(pwd)` | ❌ 待实现(P3 / Round 13) | landing `AuthModal` 4 位 pin tab(尚未加) |
| `verifySecurityQuestionAction(answer)` | ❌ 待实现 | 4 位密码忘记密码流程 |
| `logoutAction()` | ⚠️ 部分(走 Supabase Auth) | admin sidebar 退出登录 |
| `isAdminSession()` | ❌ 待实现 | server-side guard(替换 proxy.ts 里的 supabase.auth) |
| **Supabase `signInWithPassword`**(client) | ✅ 已实装(第十轮) | `AuthModal` 登录 tab |
| **Supabase `signUp`**(client) | ✅ 已实装(第十轮) | `AuthModal` 注册 tab |

### 2.7 进度统计

| 状态 | 数量 | 占比 |
|---|---|---|
| ✅ 已实现 | 10 | 41.7% |
| ❌ 待实现 | 14 | 58.3% |
| **合计** | **24** | **100%** |

---

## 3. 数据库 Schema

详见 [database-schema.sql](./database-schema.sql)。

### 3.1 表清单(7 张)

| # | 表名 | 用途 | 主键 |
|---|---|---|---|
| 1 | `settings` | 全局配置(单行) | `id int` 恒为 1 |
| 2 | `children` | 孩子 | `id bigserial` |
| 3 | `tasks` | 任务模板 | `id bigserial` |
| 4 | `task_assignments` | 任务-孩子分配(补充表,PRD 未明) | `(task_id, child_id)` |
| 5 | `task_audit` | 每次提交 + 审核状态 | `id bigserial` |
| 6 | `wishes` | 愿望 | `id bigserial` |
| 7 | `points_records` | 积分流水 | `id bigserial` |

### 3.2 视图(3 个)

- `v_wish_progress` — 愿望当前积分(由 `points_records` 聚合)
- `v_child_summary` — 孩子任务/审核聚合
- `v_dashboard_stats` — 首页 4 数

### 3.3 Storage 桶

- `avatar` — 孩子头像 + 愿望配图(public read / authenticated write)

---

## 4. 鉴权与 RLS

### 4.1 鉴权策略

PRD §8.1 已明确目标态:**4 位数字密码** 登录,登入态写入 `rewards_admin_session` cookie。

当前态(第十轮决定,2026-06-02):**沿用 Supabase Auth**(邮箱 + 密码),`proxy.ts` 用 `supabase.auth.getClaims()` 校验。Landing 装配 `AuthModal` 合并登录/注册弹窗,内部调 `supabase.auth.signInWithPassword` / `signUp`。`settings.admin_pwd` 字段(seed `'1234'`)在 Supabase 已存在但前端未消费,等 4 位密码切换时再用。

### 4.2 RLS 策略

`lib/actions.ts` 内部用 `SUPABASE_SERVICE_ROLE_KEY` 直连(绕过 RLS),所有权限校验在 action 函数内部做(server-side trust)。

RLS 在 `[database-schema.sql](./database-schema.sql)` 中预先生成(为 Supabase 接入时直接可用),保护未来如果出现 client-side 直连场景。具体策略:

| 角色 | settings | children | tasks | task_audit | wishes | points_records |
|---|---|---|---|---|---|---|
| anon(孩子端) | — | R | R | R / C | R | R |
| authenticated(管理员) | R/W | R/W | R/W | R/W | R/W | R/W |

> C = insert, R = select, W = update/delete。详细见 schema 文件。

> **当前 mock-data 阶段不连 Postgres**,RLS 不会被触发;但 DDL 保留,接入 Supabase 时无需再写。

---

## 5. 落地路径(从 mock → Supabase)

| 阶段 | 内容 | 估时 |
|---|---|---|
| **阶段 1** | 创建 Supabase 项目 → 跑 `database-schema.sql` | 30 min |
| **阶段 2** | 加 `SUPABASE_SERVICE_ROLE_KEY` 到 `.env.local`(admin 用) + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(孩子端用) | 10 min |
| **阶段 3** | 把 `lib/mock-data.ts` 的每个 getter 改成 `lib/queries.ts` 中的 `await supabase.from(...).select(...)` | 1 天 |
| **阶段 4** | 把 `lib/actions.ts` 现有 10 个 action 内部从 `mock-data` 切到 `supabase.from(...).insert/update/delete` | 1 天 |
| **阶段 5** | 实现 14 个待补 action(其中 audit/lock/delete/upload 涉及 trigger/RLS) | 1.5 天 |
| **阶段 6** | 4 位密码登录流程 + `proxy.ts` 改 cookie 校验 | 0.5 天 |
| **阶段 7** | 删 `lib/mock-data.ts`,前端组件不改(只换 import 路径) | 0.5 天 |

合计 ~5 天。

---

## 6. 当前数据来源对照

| 页面 | 当前实现 | 目标态 |
|---|---|---|
| `/admin` StatsGrid | `dashboardStats`(mock 常量) | `v_dashboard_stats` 视图 |
| `/admin` ReviewList | `dashboardReviews`(mock 数组) | `task_audit` WHERE pending ORDER BY submit_time LIMIT 3 |
| `/admin` FAB | `children` mock | `children` 全部 |
| `/admin/tasks` | `tasks` + `children` mock | `tasks` JOIN `task_assignments` + `children` |
| `/admin/wishes` | `wishes` mock | `v_wish_progress` |
| `/admin/children` | `children` mock | `children` |
| `/admin/records` | `records` mock 客户端 filter | `points_records` 服务端 filter + 索引 |
| `/admin/settings` | 静态 UI(无数据) | `settings` 单行 |
| `/child/[id]` | `getChildById` / `getChildTasksForChild` mock | `children` + `task_audit` + `v_wish_progress` |
| `/child/[id]/tasks` | `getChildTasksForChild` mock | `tasks` JOIN `task_assignments` WHERE child_id |
| `/child/[id]/wishes` | `getChildWishesForChild` mock | `v_wish_progress` WHERE child_id OR is_family |

---

## 7. 风险与边界

1. **数据真实性**:mock 数据写死 `time: "今天 08:30"`,真实 `create_time` 来自 DB,需要前端做相对时间格式化(本轮未做,见 §8.6)。
2. **积分并发**:approveTask + adjustPoints 都需要 `UPDATE children SET total_points = total_points + ?`,并发场景需要 `FOR UPDATE` 锁或单事务包起来。
3. **愿望兑换余额**:`redeemWishAction` 需要原子检查 `total_points >= wish.target_points`,Supabase 用 RPC 函数包在事务里最稳。
4. **删除语义**:删孩子会级联删其 task_audit / points_records / wishes(已配 `ON DELETE CASCADE`),前端需二次确认弹窗。
5. **4 位密码强度**:4 位 = 10000 组合,生产可加 5 次失败锁定(本版未做,见 PRD §5.4 备注)。
