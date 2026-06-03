# Admin/Child UI 细节调整

## 1. Goal

四个独立的小 UI 调整，提升细节体验。

## 2. Changes

### 2.1 空状态垂直居中

**现状**: 空状态内容（图标 + 文字）贴顶，仅靠 padding 撑开。

**改动**: `.emptyState`(admin) 和 `.empty`(child) CSS 改为 flex 垂直水平居中 + `min-height: 300px`，确保内容在容器中央。

**涉及文件**: 
- `app/admin/admin.module.css` — `.emptyState` 样式
- `app/child/child.module.css` — `.empty` 样式

### 2.2 左下角显示登录邮箱

**现状**: Sidebar footer 只有退出登录按钮，没有用户信息。

**改动**: `AdminLayoutInner`(server) 获取 `supabase.auth.getUser()` 的 email，通过 `AdminShell` 透传到 `Sidebar`。Sidebar footer 的 logout 按钮上方增加邮箱显示。

**涉及文件**:
- `app/admin/layout.tsx` — `AdminLayoutInner` 获取 email
- `components/admin/admin-shell.tsx` — 接受并传递 email
- `components/admin/sidebar.tsx` — 接收 email 并在 footer 渲染

### 2.3 去掉右上角「进入孩子模式」按钮

**现状**: `components/admin/page-header.tsx` 组件存在但未被任何客户端组件引用，是死代码。

**改动**: 直接删除该文件。

**涉及文件**: `components/admin/page-header.tsx` — 删除

### 2.4 去掉 child 页星星的 admin 链接

**现状**: ChildHeader 中星星积分区域用 `<Link href="/admin/children">` 包裹，点击跳转到 admin。

**改动**: `<Link>` 改为 `<div>`，纯展示积分，不再可点击。

**涉及文件**:
- `components/child/child-header.tsx` — 替换 Link 为 div

## 3. 未涉及

- child 端每张卡片上的「孩子模式」链接保留不变（`children-client.tsx` 中每张 child card 的入口）
- layout 结构、导航、色彩等其他 UI 不变
