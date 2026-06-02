# Server Actions API 规范

> 24 个 server action 的完整签名、输入、返回、调用方、RLS 要求、当前实现状态。
> 与 [data-architecture.md](./data-architecture.md) §2 对应,详略互补。

## 约定

- **路径**:全部在 `lib/actions.ts`(`"use server"` 顶部标记)
- **类型**:`(formData: FormData) => Promise<void | boolean>` 或 `(args) => Promise<void | boolean>`
- **鉴权**:server action 内部用 `SUPABASE_SERVICE_ROLE_KEY` 直连 + cookie session 校验
- **缓存**:`revalidatePath` 显式失效相关路由
- **状态标记**:
  - ✅ — 已在 `lib/actions.ts` 实现(底层走 mock)
  - ⚠️ — 部分实现(走 Supabase Auth,4 位密码未做)
  - ❌ — 待实现

---

## 1. 任务域

### `addTaskAction(formData)` ✅
- **调用方**:`/admin/tasks` 新增按钮
- **Input(formData)**:
  - `name: string` — 任务名称(必填)
  - `icon: string` — emoji 字符
  - `points: number` — 积分(> 0)
  - `cycle: "daily" | "weekly" | "once"`
  - `assignedChildren: string[]` — 复选框,值为 child.name
- **Output**:`Promise<void>`
- **副作用**:`INSERT tasks` + `INSERT task_assignments` (一个 task 一行)
- **revalidatePath**:`/admin/tasks`
- **RLS**:authenticated ALL

### `updateTaskAction(formData)` ✅
- **调用方**:`/admin/tasks` 编辑按钮
- **Input(formData)**:
  - `taskId: string`
  - `name, icon, points, cycle, assignedChildren`(同 add)
- **Output**:`Promise<void>`
- **副作用**:`UPDATE tasks` + `DELETE/INSERT task_assignments`(diff)
- **revalidatePath**:`/admin/tasks`

### `closeTaskAction(formData)` ✅
- **调用方**:`/admin/tasks` 关闭按钮
- **Input(formData)**:
  - `taskId: string`
  - `reason: string` — 关闭原因(默认 "已关闭")
- **Output**:`Promise<void>`
- **副作用**:`UPDATE tasks SET status = false, closed_reason = ?`(注:本字段需在 schema 补)
- **revalidatePath**:`/admin/tasks` + `/child/*`(孩子端不再看到)

### `restoreTaskAction(taskId)` ❌
- **调用方**:`/admin/tasks` "恢复启用" 按钮(当前静态)
- **Input**:`taskId: string`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE tasks SET status = true, closed_reason = NULL`
- **revalidatePath**:`/admin/tasks` + `/child/*`

### `submitTaskAction(taskId)` ✅
- **调用方**:`/child/[childId]` + `/child/[childId]/tasks` "完成" 按钮
- **Input**:`taskId: string`(注意:mock 现状是 child_task.id,真实态应是 tasks.id)
- **Output**:`Promise<void>`
- **副作用**:`INSERT task_audit(task_id, child_id, submit_time, audit_status='pending')`
- **revalidatePath**:`/child/[childId]/tasks` + `/child/[childId]`

### `approveTaskAction(auditId)` ❌
- **调用方**:`/admin` "通过" 按钮(当前静态)
- **Input**:`auditId: string`(task_audit.id)
- **Output**:`Promise<boolean>`(成功 true / 已审核 false)
- **副作用**(必须在单个 RPC 事务中):
  1. `UPDATE task_audit SET audit_status='agree', audit_time=now() WHERE id=? AND status='pending'`
  2. `UPDATE children SET total_points = total_points + (SELECT points FROM tasks WHERE id = task_audit.task_id)`
  3. `INSERT points_records(child_id, related_id, record_type='earn', points, remark)`
- **revalidatePath**:`/admin` + `/admin/records` + `/child/[childId]`

### `rejectTaskAction(auditId, reason?)` ❌
- **调用方**:`/admin` "拒绝" 按钮
- **Input**:`auditId: string`, `reason?: string`
- **Output**:`Promise<boolean>`
- **副作用**:`UPDATE task_audit SET audit_status='refuse', audit_time=now(), refuse_reason=?`
- **revalidatePath**:`/admin` + `/child/[childId]`

---

## 2. 愿望域

### `addWishAction(formData)` ✅
- **调用方**:`/admin/wishes` 新增按钮
- **Input(formData)**:
  - `name: string`
  - `image: string` — emoji 或 storage URL
  - `points: number` — 目标积分
  - `owner: string` — 孩子名 或 "家庭"
- **Output**:`Promise<void>`
- **副作用**:`INSERT wishes`(is_family 派生自 owner)
- **revalidatePath**:`/admin/wishes` + `/child/*`

### `updateWishAction(formData)` ✅
- **调用方**:`/admin/wishes` 编辑按钮
- **Input(formData)**:同 add + `wishId`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE wishes WHERE id=?`
- **revalidatePath**:`/admin/wishes` + `/child/*`

### `lockWishAction(wishId, isLock)` ❌
- **调用方**:`/admin/wishes` "锁定" 按钮
- **Input**:`wishId: string`, `isLock: boolean`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE wishes SET is_lock=? WHERE id=?`
- **revalidatePath**:`/admin/wishes` + `/child/*`

### `deleteWishAction(wishId)` ❌
- **调用方**:`/admin/wishes` 🗑 按钮
- **Input**:`wishId: string`
- **Output**:`Promise<void>`
- **副作用**:`DELETE FROM wishes WHERE id=?`(`ON DELETE CASCADE` 自动清 `points_records.related_id` 孤儿)
- **revalidatePath**:`/admin/wishes` + `/admin/records` + `/child/*`

### `redeemWishAction(wishId, childId)` ✅
- **调用方**:`/child/[childId]/wishes` 兑换按钮
- **Input**:`wishId: string`, `childId: string`
- **Output**:`Promise<boolean>`(成功 true / 积分不足 false)
- **副作用**(单 RPC 事务):
  1. 校验 `children.total_points >= wishes.target_points`
  2. `UPDATE children SET total_points = total_points - target_points`
  3. `UPDATE wishes SET is_finish = true`(可选,如一次性)
  4. `INSERT points_records(child_id, related_id, record_type='wish', points=-target_points, remark='兑换')`
- **revalidatePath**:`/child/[childId]/wishes` + `/child/[childId]`

---

## 3. 孩子域

### `addChildAction(formData)` ✅
- **调用方**:`/admin/children` 新增按钮
- **Input(formData)**:
  - `name: string`
  - `themeKey: "sky" | "coral" | "mint" | "lavender" | "sun"`
  - `themeColor: string` — hex
- **Output**:`Promise<void>`
- **副作用**:`INSERT children`(slug 派生自 name)
- **revalidatePath**:`/admin/children` + `/child/*`

### `updateChildAction(formData)` ✅
- **调用方**:`/admin/children` 编辑按钮
- **Input(formData)**:同 add + `childId`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE children WHERE id=?`(改 name 时同步重算 slug)
- **revalidatePath**:`/admin/children` + `/child/*`

### `deleteChildAction(childId)` ❌
- **调用方**:`/admin/children` 🗑 按钮
- **Input**:`childId: string`
- **Output**:`Promise<boolean>`
- **副作用**:`DELETE FROM children WHERE id=?`(级联清 task_assignments / task_audit / wishes / points_records)
- **revalidatePath**:`/admin/children` + `/admin/records` + `/admin/tasks` + `/admin/wishes`
- **风险**:该 child 关联的 task_audit / points_records 会被级联删除,需前端二次确认 + 提示"将删除 N 条记录"

### `uploadAvatarAction(childId, file)` ❌
- **调用方**:`/admin/children` 头像上传
- **Input**:`childId: string`, `file: File`(multipart/form-data)
- **Output**:`Promise<string | null>`(新 public URL)
- **副作用**:
  1. `supabase.storage.from('avatar').upload(childId + ext, file)`(覆盖)
  2. 拿 public URL
  3. `UPDATE children SET avatar_url=?`
- **revalidatePath**:`/admin/children` + `/child/[childId]`

---

## 4. 积分流水域

### `adjustPointsAction(formData)` ✅
- **调用方**:`/admin` FAB +/− 模态
- **Input(formData)**:
  - `childId: string`
  - `points: number` — 数值(> 0)
  - `reason: string`
  - `type: "manual" | "deduct"`
- **Output**:`Promise<boolean>`(扣分不足 → false)
- **副作用**(单事务):
  1. 校验 deduct 时 `children.total_points >= points`
  2. `UPDATE children SET total_points = total_points ± ?`
  3. `INSERT points_records(child_id, record_type, points, remark)`
- **revalidatePath**:`/admin` + `/admin/records` + `/admin/children`

### `exportRecordsAction(filters)` ❌
- **调用方**:`/admin/records` "导出数据" 按钮
- **Input**:`{ childId?: string, type?: string, dateFrom?: string, dateTo?: string }`
- **Output**:`Promise<{ filename: string, content: string }>`(JSON 字符串,前端 `<a download>` 触发)
- **副作用**:`SELECT * FROM points_records WHERE ...` 序列化
- **不写 DB**

---

## 5. 设置域

### `changePasswordAction(currentPwd, newPwd)` ❌
- **调用方**:`/admin/settings` "修改密码" 模态
- **Input**:`currentPwd: string`, `newPwd: string`(4 位数字)
- **Output**:`Promise<boolean>`(当前密码错误 → false)
- **副作用**:`UPDATE settings SET admin_pwd = newPwd WHERE id=1 AND admin_pwd = currentPwd`
- **风险**:4 位密码,需在 server 校验强度 + 防爆破(后续轮次加失败次数)

### `setSecurityQuestionAction(question, answer)` ❌
- **调用方**:`/admin/settings` "设置密保" 模态
- **Input**:`question: string`, `answer: string`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE settings SET security_question=?, security_answer=?`

### `updateSettingAction(key, value)` ❌
- **调用方**:`/admin/settings` 主题色 / 音效 / 紧凑模式 toggle
- **Input**:`key: "global_theme" | "sound_open" | "compact_mode"`, `value: string | boolean`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE settings SET ${key}=? WHERE id=1`
- **注**:`compact_mode` 字段在 schema 未列,需先 ALTER TABLE 添加

### `backupDataAction()` ❌
- **调用方**:`/admin/settings` "立即备份" 按钮
- **Output**:`Promise<{ filename: string, content: string }>`(JSON)
- **副作用**:`SELECT * FROM children / tasks / task_audit / wishes / points_records` 打包
- **不写 DB**

### `restoreDataAction(json)` ❌
- **调用方**:`/admin/settings` "选择文件" 按钮
- **Input**:`json: string`(上传的备份文件内容)
- **Output**:`Promise<boolean>`(格式错误 → false)
- **副作用**:事务内 `TRUNCATE` 5 表 + `INSERT` 备份数据
- **风险**:不可逆,需二次确认 + 输入"恢复"二字

### `clearAllDataAction()` ❌
- **调用方**:`/admin/settings` "清空数据" 按钮
- **Output**:`Promise<void>`
- **副作用**:事务内 `TRUNCATE` 5 表(children/tasks/task_audit/wishes/points_records),**保留** settings
- **风险**:不可逆,需二次确认 + 输入"确认清空"

---

## 6. 鉴权域(PRD §8.1 TODO)

> **第十轮(2026-06-02)更新**:Landing 登录/注册流程已实装,但走的是 Supabase 客户端 SDK(`signInWithPassword` / `signUp`),**不直接调本节列出的 5 个 server action**。这些 action 仍是 4 位密码目标态(PRD §8.1)的预留,P3 / Round 13 优先级不变。  
> 当前生产路径(Supabase Auth)的具体 API 调用见 `components/landing/auth-modal.tsx`,不列入本节 server action 清单。

### `loginWithPasswordAction(pwd)` ❌
- **调用方**:landing `AuthModal` 4 位 pin tab(目标态,见 PRD §2.1 / §8.1,本轮未实装)
- **Input**:`pwd: string`(4 位)
- **Output**:`Promise<boolean>`(命中 → true,写 cookie)
- **副作用**:
  1. `SELECT admin_pwd FROM settings WHERE id=1`
  2. 命中 → `cookies().set('rewards_admin_session', jwt, { httpOnly, secure, sameSite: 'lax', maxAge: 7d })`
  3. JWT payload: `{ sub: 'admin', iat, exp }`,密钥 `process.env.SUPABASE_JWT_SECRET`
- **不写 DB**

### `verifySecurityQuestionAction(answer)` ❌
- **调用方**:landing 弹窗 "忘记密码 → 密保问题" 展开
- **Input**:`answer: string`
- **Output**:`Promise<boolean>`(命中 → 进入"重置密码"步骤)
- **副作用**:`SELECT security_answer FROM settings WHERE id=1`

### `resetPasswordAfterSecurityAction(newPwd)` ❌
- **调用方**:密保命中后的"重置密码"步骤
- **Input**:`newPwd: string`
- **Output**:`Promise<void>`
- **副作用**:`UPDATE settings SET admin_pwd=?` + 写 cookie

### `logoutAction()` ⚠️
- **当前**:sidebar 直接 `supabase.auth.signOut()`(走 Supabase Auth)
- **目标**:改 `cookies().delete('rewards_admin_session')`
- **Output**:`Promise<void>`

### `isAdminSession()` ❌
- **调用方**:`proxy.ts` 守卫 + 各 admin layout / page
- **Output**:`Promise<boolean>`
- **副作用**:`cookies().get('rewards_admin_session')` + JWT 校验
- **替换**:`lib/supabase/proxy.ts` 中的 `supabase.auth.getClaims()` 检查

---

## 7. 实施优先级建议

按"业务影响 + 实现成本"打分,推荐落地顺序:

| 优先级 | 轮次 | Action 集 |
|---|---|---|
| P0 | Round 10 | approveTaskAction / rejectTaskAction(首页待审核功能闭环) |
| P0 | Round 10 | restoreTaskAction / lockWishAction / deleteWishAction / deleteChildAction(删除/恢复全链路) |
| P1 | Round 11 | uploadAvatarAction(头像上传) |
| P1 | Round 11 | changePasswordAction / setSecurityQuestionAction(基础设置) |
| P2 | Round 12 | updateSettingAction(主题/音效) |
| P2 | Round 12 | exportRecordsAction(数据导出) |
| P3 | Round 13 | backupDataAction / restoreDataAction / clearAllDataAction(数据管理) |
| P3 | Round 13 | loginWithPasswordAction / verifySecurityQuestionAction / isAdminSession(4 位密码完整流程,见 PRD §8.1) |
