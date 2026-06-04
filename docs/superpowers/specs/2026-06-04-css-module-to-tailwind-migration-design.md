# CSS Modules → Tailwind `@apply` 迁移

## 1. Goal

将项目中 7 个 `.module.css` 文件的手写 CSS 迁移为 Tailwind `@apply` 指令，消除硬编码设计 token，实现单一设计源。**视觉效果零变化。**

## 2. Approach

**保留 `.module.css` 文件结构**，不改变 JSX 组件的 `import styles` 模式。只在 CSS 文件内部将 utility 类声明改写为 `@apply`。对于 Tailwind 无法表达的内容保留原生 CSS：

- `@keyframes` / animation — **全保留**
- 复杂选择器（`:not()`、`::before`、`::after`、`:nth-child`）— **保留选择器，内部用 `@apply`**
- 复杂 `@media` 查询 — **保留 `@media`，内部用 `@apply`**
- Tailwind 无法表达的 grid（`auto-fill`/`minmax`、`subgrid`）、`calc()`、特定 transform — **保留原生**
- child 主题色计算（`--theme-*` CSS 变量 + var()）— **保留**

## 3. Scope

| 文件 | 行数 | 复杂度 | 策略 |
|---|---|---|---|
| `app/landing.module.css` | 387 | 低 | 全量 `@apply` |
| `components/common/toast.module.css` | ~50 | 低 | `@apply` + 保留 keyframes |
| `components/child/child-gate.module.css` | ~80 | 中 | `@apply` + 保留组合选择器 |
| `components/child/confetti.module.css` | ~80 | 中 | 保留 keyframes 和 animation，只转容器样式 |
| `components/landing/auth-modal.module.css` | ~150 | 中 | `@apply` + 保留复杂选择器 |
| `app/child/child.module.css` | 699 | 高 | 逐块 `@apply`，主题色保留 |
| `app/admin/admin.module.css` | 1791 | 高 | 按区块分批迁移 |

## 4. Migration Order

1. **Phase 1（小文件验证）**: `landing` → `toast` → `child-gate` → `confetti`
2. **Phase 2（中等文件）**: `auth-modal`
3. **Phase 3（大文件攻坚）**: `child` → `admin`（每块独立 PR/commit）

## 5. Migration Patterns

**Utility 类映射原则**（每个声明块只改值部分，选择器不变）：

| 原始 | `@apply` |
|---|---|
| `display: flex; align-items: center; gap: 12px;` | `@apply flex items-center gap-3;` |
| `padding: 16px;` | `@apply p-4;` |
| `background: #f9f7f5;` | `@apply bg-cafe-surface;` |
| `border-radius: 8px;` | `@apply rounded-lg;` |
| `font-size: 14px; font-weight: 600;` | `@apply text-sm font-semibold;` |
| `color: #5d4432;` | `@apply text-cafe-primary;` |
| `border: 1px solid #e5ddd5;` | `@apply border border-cafe-border;` |
| `box-shadow: 0 4px 16px rgba(...);` | `@apply shadow-lg;` |
| `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;` | `@apply grid grid-cols-2 gap-4;` |
| `margin-top: 24px;` | `@apply mt-6;` |

**非 `@apply` 保留场景示例：**

```css
/* 保留：复杂 grid */
.statGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  @apply p-4;  /* 只转内边距 */
}

/* 保留：keyframes */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.toastEnter {
  animation: slideIn 0.3s ease-out;
  @apply fixed top-4 right-4 z-50;  /* 只转定位/层级 */
}

/* 保留：复杂选择器，内部 @apply */
.card:not(:last-child) {
  @apply mb-4;
}

/* 保留：child 主题变量 */
.childHeader {
  background: var(--child-header-bg);
  @apply flex items-center justify-between px-4 py-3;
}
```

## 6. Design Token Consolidation

- `cafe` 色板（`tailwind.config.ts`）作为设计 token 的单一源
- 已有 `cafe-*` 的 → 直接映射
- 特殊色（child 主题、confetti 多彩色）→ 保留原生 CSS 变量
- 不需要修改 `tailwind.config.ts`，现有色板覆盖率足够

## 7. Risk & Verification

- **零视觉风险**：迁移后 `build` 无样式破损
- **验证方式**：`npm run dev` 逐页面目测对比
- **回滚**：每个 CSS Module 改完后可独立 git revert
- **动画不受影响**：keyframes/animation 全保留
