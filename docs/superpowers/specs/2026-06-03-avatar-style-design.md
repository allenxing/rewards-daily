# 孩子头像改造 + 主题色统一方案

## 1. Goal

- 去掉孩子头像上传功能，改为 Smile/SmilePlus 图标选择
- 积分流水、审核列表等场景统一使用孩子主题色，替代当前基于名字的 hash 色块

## 2. Database

### 2.1 新增列

```sql
ALTER TABLE children ADD COLUMN avatar_style text NOT NULL DEFAULT 'smile';
-- CHECK 约束确保只存允许的值
ALTER TABLE children ADD CONSTRAINT avatar_style_check 
  CHECK (avatar_style IN ('smile', 'smile-plus'));
```

### 2.2 说明

`avatar_url` 列保留不动（数据仍在，不再读取）。现有孩子默认 `avatar_style = 'smile'`。

## 3. 数据模型变更

### 3.1 `Child` (lib/ui-types.ts)

```ts
export type Child = {
  id: number;
  name: string;
  slug: string;
  themeKey: string;
  themeColor: string;
  totalPoints: number;
  level: number;
  avatarStyle: "smile" | "smile-plus";
  shareToken: string;
};
```

移除 `avatarUrl`、`avatarBg`、`avatarColor`。

### 3.2 `ReviewItem` (lib/ui-types.ts)

```ts
export type ReviewItem = {
  id: number;
  taskName: string;
  childName: string;
  submitTime: string;
  points: number;
  themeColor: string;
  avatarStyle: "smile" | "smile-plus";
};
```

移除 `avatarBg`、`avatarFg`。

### 3.3 `PointsRecord` (lib/ui-types.ts)

```ts
export type PointsRecord = {
  id: number;
  childId: number;
  childName: string;
  themeColor: string;
  avatarStyle: "smile" | "smile-plus";
  title: string;
  meta: string;
  type: "earn" | "deduct" | "manual" | "wish";
  points: number;
  time: string;
};
```

移除 `childAvatarBg`、`childAvatarColor`。

## 4. 数据查询变更

### 4.1 `mapChild` (lib/queries/children.ts)

不再处理 `avatarUrl`/`avatarBg`/`avatarColor`，直接透传 `avatar_style`。

### 4.2 `getRecords` (lib/queries/points-records.ts)

Join 子表时多取 `theme_color` 和 `avatar_style`，替代当前 hash 色块逻辑。

```ts
// DB join 从 children!inner(name) 改为 children!inner(name, theme_color, avatar_style)
```

### 4.3 `toReviewItem` (lib/queries/task-audit.ts)

Join 子表时多取 `theme_color` 和 `avatar_style`，透传到 `ReviewItem`。

```ts
// DB join 从 children!inner(name) 改为 children!inner(name, theme_color, avatar_style)
```

### 4.4 其他

`lib/queries/wishes.ts` → `getWishesForAdmin` 中用到 childName 和 `toAdminWish` 中的 `owner` 显示，不涉及主题色变更。

## 5. UI 变更

### 5.1 孩子管理表单 — 新增/编辑

用图标选择器替换文件上传：

```tsx
// 两个圆形按钮, Smile / SmilePlus
<button type="button" onClick={() => setAvatarStyle("smile")}>
  <Smile size={28} />
</button>
<button type="button" onClick={() => setAvatarStyle("smile-plus")}>
  <SmilePlus size={28} />
</button>
<input type="hidden" name="avatarStyle" value={avatarStyle} />
```

去掉 `avatarFile` 状态、文件 input、预览图、上传逻辑（`uploadAvatarAction` 调用）。

### 5.2 孩子管理卡片列表

```tsx
<div style={{ background: child.themeColor }}>
  {child.avatarStyle === "smile" ? <Smile /> : <SmilePlus />}
</div>
```

### 5.3 积分流水记录

每条记录左侧：主题色圆形背景 + 图标 + 名字。

```tsx
<div style={{ background: record.themeColor }}>
  {record.avatarStyle === "smile" ? <Smile size={14} /> : <SmilePlus size={14} />}
</div>
<span>{record.childName}</span>
```

### 5.4 审核列表

同积分流水：主题色背景 + 图标 + 名字。

### 5.5 孩子端 Header

使用 `themeColor` 做背景, icon 白色。不读 `avatarUrl`。视觉变化：之前有上传头像的孩子，头像会从照片变为 Smile/SmilePlus 图标。

### 5.6 浮动操作组件 (floating-actions.tsx)

孩子下拉选项显示格式不变：`{c.name} · 当前 {c.totalPoints} 分`。Child 类型移除了 `avatarUrl`/`avatarBg`/`avatarColor`，但 `name` 和 `totalPoints` 不受影响。

## 6. Server Action 变更

### 6.1 addChildAction

接收 `avatarStyle` 参数，写入 DB。

### 6.2 updateChildAction

接收 `avatarStyle` 参数，写入 DB。

### 6.3 uploadAvatarAction

移除或保留不动（不再在前端调用）。

## 7. 迁移策略

| Step | 文件 | 操作 |
|------|------|------|
| 1 | 数据库 | 执行 migration 加 `avatar_style` 列 |
| 2 | `lib/database.types.ts` | 重新生成类型（或手动补 `avatar_style`） |
| 3 | `lib/ui-types.ts` | `Child`、`ReviewItem`、`PointsRecord` 类型调整 |
| 4 | `lib/queries/children.ts` | `mapChild` 更新 |
| 5 | `lib/queries/points-records.ts` | `getRecords` join + 类型调整 |
| 6 | `lib/queries/task-audit.ts` | `toReviewItem` + 查询 join 调整 |
| 7 | `lib/actions.ts` | `addChildAction`/`updateChildAction` 增加 `avatarStyle` |
| 8 | `components/admin/children-client.tsx` | 表单替换 + 卡片渲染更新 |
| 9 | `components/admin/review-item.tsx` | 渲染调整 |
| 10 | `components/admin/review-section.tsx` | 透传新字段 |
| 11 | `components/admin/review-list.tsx` | 透传新字段 |
| 12 | `app/admin/records/records-client.tsx` | 渲染调整 |
| 13 | `components/child/child-header.tsx` | 渲染调整 |
| 14 | `components/admin/floating-actions.tsx` | 验证类型兼容性（无逻辑变更） |

## 8. 未涉及

- 历史 `avatar_url` 数据清理（保留不动）
- Storage bucket `avatar` 清理（保留不动）
