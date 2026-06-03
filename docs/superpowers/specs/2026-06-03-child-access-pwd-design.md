# Child 页面密码保护

## 1. Goal

给 child 页面增加可选的密码保护。家长在设置页开启后，访问 child 页面需要输入 4 位 admin 密码。

## 2. Database

### 2.1 新增列

```sql
ALTER TABLE settings ADD COLUMN IF NOT EXISTS child_access_pwd_enabled boolean NOT NULL DEFAULT false;
```

复用现有 `admin_pwd` 字段做密码校验。

### 2.2 新增 RPC 函数

settings 表有 RLS（仅 authenticated owner 可读），child 页面是公开路由。
创建 SECURITY DEFINER 函数绕过 RLS，仅用于验证密码：

```sql
CREATE OR REPLACE FUNCTION verify_child_password(p_owner_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settings
    WHERE owner_id = p_owner_id AND admin_pwd = p_password
  );
END;
$$;
```

同时创建第二个函数，查询 child 的 owner 是否开启了密码保护：

```sql
CREATE OR REPLACE FUNCTION check_child_access_enabled(p_child_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT owner_id INTO v_owner_id FROM children WHERE id = p_child_id;
  RETURN EXISTS (
    SELECT 1 FROM settings
    WHERE owner_id = v_owner_id AND child_access_pwd_enabled = true
  );
END;
$$;
```

## 3. 类型变更

- `lib/database.types.ts` — settings Row 补 `child_access_pwd_enabled`
- `lib/queries/settings.ts` — `Settings` 类型补 `childAccessPwdEnabled`

## 4. 设置页 UI

`settings-client.tsx` — 安全设置区新增一行：

| 行 | 操作 |
|---|------|
| Child页面密码保护 | `<Toggle>` → 调 `updateSettingAction("child_access_pwd_enabled", val)` |
| 描述 | 已 i18n |

## 5. Child 页面密码门

### 5.1 数据流

```
ChildLayout (server)
  → getChildByShareToken() → child
  → 渲染 ChildGate { childId, children }

ChildGate (client component):
  → mount → supabase.rpc("check_child_access_enabled", { p_child_id: childId })
  → false → 直接渲染 children
  → true  → 显示密码弹窗
  → 输入密码 → supabase.rpc("verify_child_password", { p_owner_id, p_password })
  → true → sessionStorage 标记 → 渲染 children
  → false → 显示「密码错误」
```

### 5.2 Server Actions

不新增 server action。直接由 ChildGate 客户端组件调用 Supabase RPC。

使用 `createClient()` from `@/lib/supabase/client`（浏览器端），RPC 函数是 SECURITY DEFINER，即使 anon 角色也能执行。

### 5.3 ChildGate 组件

`components/child/child-gate.tsx` — 新建 `"use client"` 组件：

```
Props: { childId: number; children: ReactNode }
```

Behavior:
- mount → 调 RPC `check_child_access_enabled`
- 加载中 → 显示空白或 loading
- disabled → 直接渲染 `{children}`
- enabled → 全屏遮罩 + 弹窗：
  - 标题: "🔒 家长验证"
  - 副标题: "请输入4位数字密码"
  - 4 个数字输入框（或一个密码 input + `inputMode="numeric"` `maxLength=4`）
  - 确认按钮
  - 错误提示（密码错误时显示）
- 验证通过 → `sessionStorage.setItem("child_access_granted", "1")` → 渲染 children
- 关闭标签页 → sessionStorage 自动清除

### 5.4 ChildLayout 变更

渲染 `<ChildGate childId={child.id}>{children}</ChildGate>` 替代直接渲染 children。

## 6. 涉及文件

| Step | 文件 | 操作 |
|------|------|------|
| 1 | 数据库 | migration 加列 + 2 个 RPC 函数 |
| 2 | `lib/database.types.ts` | 补 `child_access_pwd_enabled` |
| 3 | `lib/queries/settings.ts` | Settings 类型补字段 |
| 4 | `lib/actions.ts` | 无变更 |
| 5 | `components/child/child-gate.tsx` | 新建密码弹窗组件 |
| 6 | `app/child/[shareToken]/layout.tsx` | 集成 ChildGate |
| 7 | `app/admin/settings/settings-client.tsx` | 安全区加 toggle 行 |
| 8 | `messages/zh.json`, `en.json` | 新增文案 |

## 7. 未涉及

- 不改 RLS 策略
- 不改 proxy.ts
- 不改现有 `admin_pwd` 逻辑
- 不限制错误次数
