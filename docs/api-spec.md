# Server Actions API 规范

> 全部 server action 在 `lib/actions.ts` 中，使用 `"use server"` 指令。
> 鉴权：内部用 `createClient()`（Supabase Auth session）。错误返回 error code 字符串。
> 返回类型：`ActionResult<T> = { ok: true; data?: T } | { ok: false; error: string }`。

## 1. 任务域

### `addTaskAction(formData)`
- **调用方**: `/admin/tasks` 新增按钮
- **Input**: name, icon, points, cycle, assignedChildren[]
- **副作用**: INSERT tasks + INSERT task_assignments
- **revalidate**: `/admin/tasks`

### `updateTaskAction(formData)`
- **调用方**: `/admin/tasks` 编辑按钮
- **Input**: taskId + 同add字段
- **副作用**: UPDATE tasks + DELETE/INSERT task_assignments

### `closeTaskAction(formData)`
- **调用方**: 关闭按钮
- **Input**: taskId, reason
- **副作用**: UPDATE tasks SET status=false, closed_reason=?

### `restoreTaskAction(taskId)`
- **调用方**: 恢复启用按钮
- **副作用**: UPDATE tasks SET status=true, closed_reason=null

### `submitTaskAction(shareToken, taskId)`
- **调用方**: child页面完成按钮
- **Input**: shareToken, taskId
- **副作用**: INSERT task_audit (pending)
- **revalidate**: child页面相关路由

### `approveTaskAction(auditId)`
- **调用方**: admin控制台通过按钮
- **副作用**: RPC `approve_task`（更新审核状态 + 加积分 + 写流水）

### `rejectTaskAction(auditId, reason)`
- **调用方**: admin控制台拒绝按钮
- **副作用**: UPDATE task_audit SET status='refuse'

## 2. 愿望域

### `addWishAction(formData)`
- **Input**: name, image, points, owner
- **副作用**: INSERT wishes

### `updateWishAction(formData)`
- **Input**: wishId + 同上
- **副作用**: UPDATE wishes

### `lockWishAction(wishId, locked)`
- **副作用**: UPDATE wishes SET is_lock=?

### `deleteWishAction(wishId)`
- **副作用**: DELETE wishes

### `redeemWishAction({ shareToken, wishId })`
- **副作用**: RPC `redeem_wish`（校验积分 + 扣分 + 写流水）

## 3. 孩子域

### `addChildAction(formData)`
- **Input**: name, themeKey, themeColor, avatarStyle
- **副作用**: INSERT children（自动生成slug + shareToken）

### `updateChildAction(formData)`
- **Input**: childId + 同上字段
- **副作用**: UPDATE children

### `deleteChildAction(childId)`
- **副作用**: DELETE children（级联清理关联数据）+ 清理storage

### `uploadAvatarAction(childId, formData)`
- **说明**: 保留但不再在前端调用（头像改为Smile/SmilePlus图标）

## 4. 积分流水域

### `adjustPointsAction(formData)`
- **Input**: childId, points, reason, type
- **副作用**: RPC `adjust_points`

### `exportRecordsAction()`
- **Output**: JSON文件下载
- **不写DB**

## 5. 设置域

### `changePasswordAction(formData)`
- **Input**: password（4位数字，直接覆盖旧密码）
- **副作用**: UPDATE settings SET admin_pwd=?
- **无当前密码校验，无确认密码**

### `updateSettingAction(key, value)`
- **Input**: key = "global_theme" | "sound_open" | "compact_mode" | "child_access_pwd_enabled"
- **副作用**: UPDATE settings SET ${key}=?

### `backupDataAction()`
- **Output**: 全表数据JSON打包
- **不写DB**

### `restoreDataAction(formData)`
- **Input**: file（JSON备份文件）
- **副作用**: DELETE + INSERT 恢复数据

### `clearAllDataAction()`
- **副作用**: DELETE所有表数据（保留settings）

## 6. Child密码保护（RPC，非server action）

### `check_child_access_enabled(p_child_id)`
- **类型**: SECURITY DEFINER RPC
- **返回**: boolean — 该孩子的owner是否开启了密码保护

### `verify_child_password(p_owner_id, p_password)`
- **类型**: SECURITY DEFINER RPC
- **返回**: boolean — 密码是否正确
