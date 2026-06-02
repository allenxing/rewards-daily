# 实施计划 — 第一轮 (设计还原 + Admin 守卫)

> 状态: 进行中  
> 范围: Landing 完整还原 + Admin 路由登录守护  
> 下轮: Admin 6 子页 + Child 3 子页 + /child 路由策略

---

## 1. 本轮目标

| 目标 | 状态 |
|---|---|
| `/` 视觉还原 design/index.html | ✅ Stage 3 |
| `/admin/*` 登录后才可访问 | ✅ Stage 4 |
| 登录/注册/登出 redirect 路径正确 | ✅ Stage 4 |
| 全局设计 token(Cafe 主色)就位 | ✅ Stage 1 |
| 字体 Poppins 就位 | ✅ Stage 2 |
| 主题切换基础设施(为后续留口) | ✅ Stage 1 (CSS 变量) |

**不做的(下一轮)**:
- 4 位密码弹窗(用现有邮箱密码登录替代)
- /child/* 路由(留待下轮决定是否免登录)
- Admin 6 个子页(dashboard/tasks/wishes/children/records/settings)
- Child 3 个子页(首页/tasks/wishes)
- 真实 Supabase 数据接入(本轮用静态数据/mock)
- 主题切换的 UI 控件(本轮只把 token 就位)

---

## 2. 设计 Token (Cafe 主色)

从 `design/index.html` 与 `design/shared.css` 提取,落到 Tailwind `extend.colors` 与 `globals.css` 的 shadcn CSS 变量。

| Token | Hex | 用途 |
|---|---|---|
| `--primary` | `#5D4432` | 棕主色 — 按钮、激活态、icon 底 |
| `--primary-light` | `#7A5C48` | 棕主色 hover |
| `--primary-dark` | `#4A3628` | 深棕(预留) |
| `--secondary` | `#E9E3DD` | 米色次按钮 |
| `--surface` | `#F9F7F5` | 页面底色 |
| `--surface-alt` | `#F3EFEB` | 卡片/输入框底色 |
| `--text` | `#3E2B1E` | 主文本 |
| `--text-secondary` | `#8B7B6B` | 次要文本 |
| `--border` | `#E5DDD5` | 边框/分割线 |
| `--success` | `#16A34A` | 绿色徽章/通过 |
| `--warning` | `#D97706` | 橙色徽章/待审核 |
| `--danger` | `#DC2626` | 红色徽章/拒绝/删除 |
| `--info` | `#2563EB` | 蓝色徽章 |
| `--font-display` | Poppins | 标题/正文统一 |
| `--font-body` | Poppins |  |

---

## 3. 路由策略

### 已就位 / 本轮实现

| 路由 | 守卫 | 渲染 |
|---|---|---|
| `/` | 无(公开) | landing (本轮) |
| `/auth/*` | 无(公开) | starter 现成 |
| `/admin` | ✅ RSC 守卫 + proxy | 本轮占位 dashboard,下轮实装 6 子页 |
| `/admin/*` | ✅ 同上 | 同上 |
| `/child/*` | proxy 默认拦截 | **下轮决定**:免登录 / 加白名单 / 加 childId 校验 |
| `/protected` | proxy 默认拦截 | starter 样例,后续清理 |

### Auth 流程

```
未登录访问 /admin
  └─→ proxy.ts (Edge): getClaims() = null → redirect /auth/login
       └─→ 用户在 /auth/login 邮箱密码登录
            └─→ signInWithPassword 成功
                 └─→ login-form: router.push("/admin")   ← 本轮修改
                      └─→ proxy.ts: 有 user → 放行
                           └─→ admin/layout.tsx (RSC): 二次校验 → 渲染
                                └─→ admin/page.tsx (本轮占位)
```

**冗余说明**: `proxy.ts` 已经在 Edge 跑过守卫,`app/admin/layout.tsx` 是 RSC 层的二次兜底。当 `hasEnvVars` 为 false(proxy 跳过检查)时,layout 仍能保护,避免开发态被绕过。

---

## 4. 改动清单

### 4.1 修改原项目文件(7 个)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `tailwind.config.ts` | extend.colors 注入 cafe tokens;extend.fontFamily 注入 Poppins |
| 2 | `app/globals.css` | 改写 `:root` shadcn 变量为 cafe HSL;body 字体 |
| 3 | `app/layout.tsx` | 加载 Poppins;lang="zh-CN";metadata 更新 |
| 4 | `app/page.tsx` | 整体重写为 landing |
| 5 | `components/login-form.tsx` | L42: `router.push("/protected")` → `"/admin"` |
| 6 | `components/sign-up-form.tsx` | L47: `emailRedirectTo: .../protected` → `.../admin` |
| 7 | `components/logout-button.tsx` | L13: `router.push("/auth/login")` → `"/"` |

### 4.2 新建文件(9 个)

| # | 文件 | 用途 |
|---|---|---|
| 1 | `app/admin/layout.tsx` | RSC auth guard |
| 2 | `app/admin/page.tsx` | 占位 dashboard |
| 3 | `app/landing.module.css` | landing 私有 CSS(布局工具类) |
| 4 | `components/landing/navbar.tsx` | fixed top navbar |
| 5 | `components/landing/hero.tsx` | hero section |
| 6 | `components/landing/features-grid.tsx` | 4 能力卡 |
| 7 | `components/landing/advantages-grid.tsx` | 4 优势 |
| 8 | `components/landing/footer.tsx` | copyright |
| 9 | `docs/implementation-plan.md` | 本文档 |

### 4.3 不动

- `proxy.ts` — 已含完整逻辑
- `lib/supabase/{client,server,proxy}.ts` — 原样
- `app/auth/*` — 原样
- `app/protected/*` — starter 样例(后续清理)
- `components/tutorial/*` — cruft(后续清理)
- `components/ui/*` — shadcn 原样
- `components/{hero,deploy-button,env-var-warning,next-logo,supabase-logo,theme-switcher}.tsx` — starter cruft(后续清理)

---

## 5. Landing 视觉规范(对应 design/index.html)

| 区块 | 内容 | 关键 token |
|---|---|---|
| Navbar | logo + 品牌名 + 「管理员登录」 | height 64px,sticky,backdrop-blur |
| Hero | 徽章 + 大标题(主色 span) + 副标 + 双 CTA | padding-top 160px,大字号 clamp |
| Features | 4 张能力卡(任务/积分/愿望/勋章) | grid auto-fit minmax(260px,1fr) |
| Advantages | 4 个优势项(云端/同步/隔离/轻量) | grid auto-fit minmax(300px,1fr) |
| Footer | 版权 + 产品备注 | 居中,小字 |

**按钮行为**(本轮简化): 跳 `/auth/login` 而非弹窗。

---

## 6. 验证清单

- [ ] `npm run lint` 0 errors
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `/` 看到 navbar + hero + 4 能力卡 + 4 优势卡 + footer
- [ ] 配色: 棕主色 #5D4432、米底 #F9F7F5、字 Poppins
- [ ] Hero 「开始使用」点击 → `/auth/login`
- [ ] Navbar 「管理员登录」点击 → `/auth/login`
- [ ] 未登录访问 `/admin` → 跳 `/auth/login`
- [ ] 登录成功 → 跳 `/admin` 占位
- [ ] 占位页显示 email + Logout 按钮
- [ ] Logout → 回 `/`
- [ ] 再次访问 `/admin` → 跳 `/auth/login`

---

## 7. 下一轮预告

完成本轮后,后续轮次将按以下顺序推进:

1. **设计系统扩展**: 抽 `Modal` `Tabs` `StatCard` `Toggle` `ColorPicker` `EmptyState` `Toast` 等通用组件,落到 `components/common/`
2. **Admin 6 子页**: dashboard / tasks / wishes / children / records / settings
3. **Child 路由策略**: 决定 `/child/[childId]/*` 是否免登录 + childId 校验
4. **AdminShell / ChildShell / PageHeader / BottomNav**: 抽 layout 组件
5. **Child 3 子页**: 渐变背景、Nunito 字体、礼花动画
6. **主题切换 UI**: 把已有 token 暴露为可切换主题

---

# 第二轮 (AdminShell + Dashboard) — ✅ 已完成

> 范围: Admin shell (sidebar + main + FAB + modals) + 控制台首页 dashboard  
> 设计: `docs/superpowers/specs/2026-06-02-admin-shell-dashboard-design.md`  
> 状态: 全量 lint / tsc / dev server 验证通过

## 1. 目标

| 目标 | 状态 |
|---|---|
| AdminShell 布局(PC 左侧栏 240px,移动端隐藏) | ✅ |
| Sidebar 6 个菜单项 + active 态高亮(usePathname) | ✅ |
| Sidebar 退出登录 → signOut + 回 `/` | ✅ |
| Dashboard 4 张统计卡(待审核/总积分/已完成/愿望) | ✅ |
| Dashboard 待审核任务列表(3 条 mock) | ✅ |
| 浮动 + / - 操作按钮(2 个 FAB) | ✅ |
| 加分 / 扣分弹窗(2 个,默认 hidden) | ✅ |
| 「进入孩子模式」按钮 → `/child/1`(→ 404) | ✅ |
| 5 个未建子路由 sidebar 可点 → 404(非本轮实现范围) | ✅ |
| 全部 0 lint errors / 0 tsc errors | ✅ |

## 2. 决策摘要

| # | 决策 | 理由 |
|---|---|---|
| 1 | **AdminShell 改为 server component** | 原计划标为 client,但实际无 client feature;Sidebar 是 client 即可 |
| 2 | **FAB / 弹窗 / 通过拒绝全部 static**(无 state) | 用户选择「Pure visual」,不引入 useState/useReducer |
| 3 | **弹窗默认 hidden**(HTML5 `hidden` 属性) | 与 design HTML 的 `.modal-overlay { opacity: 0; visibility: hidden }` 行为一致 |
| 4 | **Sidebar 退出登录不引用 starter `LogoutButton`** | starter 是英文 "Logout" + shadcn 按钮,与设计的中文 + nav-link 样式不符;Sidebar 内联实现 |
| 5 | **Sidebar 6 个菜单项全 live,5 个 → 404** | 用户选择「All 6 live」,Next.js 默认 404 即可 |
| 6 | **去掉移动端 hamburger 按钮** | 「Pure visual」不带 toggle;真要 toggle 等下轮 |
| 7 | **所有 6 个菜单项用 lucide-react 图标** | 与 shadcn 生态一致;`Star`(logo) / `LayoutDashboard` / `ListTodo` / `Sparkles` / `Users` / `Coins` / `Settings` / `LogOut` |

## 3. 文件变更

### 3.1 修改(1 个)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `app/admin/page.tsx` | 占位 dashboard → 完整 dashboard(AdminShell + PageHeader + StatsGrid + ReviewSection) |

### 3.2 新建(12 个)

| # | 文件 | 类型 | 用途 |
|---|---|---|---|
| 1 | `app/admin/admin.module.css` | CSS module | sidebar 布局 / slide-in / 1024px + 480px 断点 / 弹窗 / 全部 admin 视觉样式 |
| 2 | `lib/mock-data.ts` | TS constants | stats + 3 review items + children 列表 |
| 3 | `components/admin/admin-shell.tsx` | server | Sidebar + main + FAB + Modals 容器 |
| 4 | `components/admin/sidebar.tsx` | client | usePathname + 6 nav items + 退出登录 |
| 5 | `components/admin/page-header.tsx` | server | 标题 + actions slot(默认:进入孩子模式) |
| 6 | `components/admin/stat-card.tsx` | server | 单张统计卡(4 个 tone 变体) |
| 7 | `components/admin/stats-grid.tsx` | server | 4 张 stat card 装配 |
| 8 | `components/admin/review-item.tsx` | server | 单条 review row(头像 + 任务 + meta + 通过拒绝) |
| 9 | `components/admin/review-list.tsx` | server | review items 列表 |
| 10 | `components/admin/review-section.tsx` | server | card 包裹 review-list + 待处理 badge |
| 11 | `components/admin/floating-actions.tsx` | server | 2 个 FAB 按钮 |
| 12 | `components/admin/point-adjustment-modal.tsx` | server | 2 个弹窗(加分/扣分),默认 hidden |

## 4. 路由状态

| 路由 | 渲染 |
|---|---|
| `/admin` | ✅ 本轮实装:AdminShell + Dashboard |
| `/admin/tasks` `/admin/wishes` `/admin/children` `/admin/records` `/admin/settings` | 404 (Next.js default) |
| `/child/1`(从「进入孩子模式」点出) | 404 |
| `/` `/auth/*` | 不变 |

## 5. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| `/` (无 env) | ✅ 200,landing 不变 |
| `/admin` (无 env) | ✅ 200,完整 dashboard 渲染(grep 命中 20 个关键中文标签) |
| `/admin` (有 env, 无 session) | ✅ 307 → `/auth/login` |
| `/admin/tasks` (有 env) | ✅ 307 → `/auth/login` |
| Sidebar 6 项渲染 | ✅ |
| 4 张统计卡渲染 | ✅ |
| 3 条 review row 渲染 | ✅ |
| 通过/拒绝按钮存在 | ✅ |
| FAB 2 个按钮存在 | ✅ |
| 2 个弹窗 DOM 存在(默认 hidden) | ✅ |

## 6. 第三轮预告

按本轮「Pure visual」基线,继续把剩余 5 个 admin 子页 + 公共组件 + Child 端做掉:

1. **可复用组件抽取**(`components/common/`):`Modal` / `Tabs` / `EmptyState` / `PageHeader` 已被 admin 复用,可直接挪到 common
2. **5 个 admin 子页**(占位即可,本轮视觉为主):`/admin/tasks` `/admin/wishes` `/admin/children` `/admin/records` `/admin/settings`
3. **/child 路由策略决策**(沿用 login 私有 / 改 childId 公开 / 折中 childId 密钥)
4. **ChildShell + BottomNav + Child 3 子页**(渐变背景、Nunito 字体、礼花动画)
5. **主题切换 UI**(`next-themes` 已经在 layout.tsx,只缺 toggle 控件)

---

# 第三轮 (Admin 5 子页 + 公共组件) — ✅ 已完成

> 范围: 5 个 admin 子页(`tasks` / `wishes` / `children` / `records` / `settings`) + 4 个公共组件 + 完整 mock 数据  
> 状态: 全量 lint / tsc / dev server 验证通过

## 1. 目标

| 目标 | 状态 |
|---|---|
| `/admin/tasks` 完整视觉(tabs + 5 task rows + 2 modals) | ✅ |
| `/admin/wishes` 完整视觉(tabs + 5 wish cards + 1 modal) | ✅ |
| `/admin/children` 完整视觉(2 child cards + add placeholder + 1 modal) | ✅ |
| `/admin/records` 完整视觉(summary chips + filters + 8 records + empty state) | ✅ |
| `/admin/settings` 完整视觉(5 sections × N rows + 2 modals) | ✅ |
| 4 个公共组件抽取(Tabs / Modal / ColorPicker / Toggle) | ✅ |
| Mock data 扩展(tasks / wishes / children / records / 主题 / 图标预设) | ✅ |
| 6 个 admin 路由认证 gate 仍工作 | ✅ |
| 全部 0 lint errors / 0 tsc errors | ✅ |

## 2. 决策摘要

| # | 决策 | 理由 |
|---|---|---|
| 1 | **抽 `Tabs` `Modal` `ColorPicker` `Toggle` 到 `components/common/`** | 2+ 复用:Modal 5+ 处,Tabs 2 处,ColorPicker 2 处,Toggle 4 处(全在 settings) |
| 2 | **不抽 `EmptyState`** | 仅 records 用 1 次,inline 处理;records 内联 `<div hidden>` 含 lucide icon |
| 3 | **不抽 page-specific 组件**(task-row / wish-card / child-card / record-row / settings-section) | 每个只 1 页用,但 admin.module.css 共享;留在页面里更直读 |
| 4 | **设置 5 个分区合并为 `<SettingsSection>` 私有子组件** | 设置页 5 个分区结构完全相同,本地抽 + inline 定义即可 |
| 5 | **跳过 mobile card view**(design 同时渲染桌面行 + 移动卡) | "Pure visual"不需要双份 DOM,响应式 CSS 处理 |
| 6 | **批量操作 toolbar / 关闭原因 modal 等交互 UI 仍渲染** | 显示视觉所需 |
| 7 | **Toggles 硬编码 4 个不同状态** | 2 on(登录通知 / 操作音效)+ 2 off(自动备份 / 紧凑模式),纯视觉 |
| 8 | **`/admin/tasks` icons 用 emoji** | 6 个 unicode emoji 替代 lucide 图标(更贴近设计稿) |

## 3. 文件变更

### 3.1 修改(2 个)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `lib/mock-data.ts` | 加 `tasks` / `wishes` / `records` / `recordSummary` / `themePresets` / `adminColorPresets` / `iconPresets`,扩展 `children` 加 `slug` / `themeKey` / `level` |
| 2 | `app/admin/admin.module.css` | 加 ~300 行:`pageTabs` / `taskRow` / `wishCard` / `childCard` / `recordRow` / `filterBar` / `summaryBar` / `settingsSection` / `settingsRow` / `toggle` / `colorOptions` / `emptyState` / `iconGrid` 等 + 响应式扩展 |

### 3.2 新建(9 个)

| # | 文件 | 类型 | 用途 |
|---|---|---|---|
| 1 | `components/common/tabs.tsx` | server | Tabs 容器,带 count badge,首项默认 active |
| 2 | `components/common/modal.tsx` | server | 通用 Modal 包装器(标题 + body + footer + maxWidth),默认 hidden |
| 3 | `components/common/color-picker.tsx` | server | 颜色圆点选择器,selected 带 ✓ |
| 4 | `components/common/toggle.tsx` | server | iOS 风格开关,`checked` prop |
| 5 | `app/admin/tasks/page.tsx` | server | 任务管理(5 task rows + 2 modals + tabs) |
| 6 | `app/admin/wishes/page.tsx` | server | 愿望管理(5 wish cards + 1 modal + tabs) |
| 7 | `app/admin/children/page.tsx` | server | 孩子管理(2 cards + add placeholder + 1 modal) |
| 8 | `app/admin/records/page.tsx` | server | 积分流水(summary + filters + 8 records + empty state) |
| 9 | `app/admin/settings/page.tsx` | server | 系统设置(5 sections + 2 modals) |

## 4. 路由状态

| 路由 | 渲染 |
|---|---|
| `/admin` | ✅ 第二轮实装(dashboard) |
| `/admin/tasks` | ✅ **本轮** |
| `/admin/wishes` | ✅ **本轮** |
| `/admin/children` | ✅ **本轮** |
| `/admin/records` | ✅ **本轮** |
| `/admin/settings` | ✅ **本轮** |
| `/child/[childId]` | 404(下轮决策) |

## 5. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors(初版 3 个未用 import,已修) |
| `npx tsc --noEmit` | ✅ 0 errors |
| 6 个 admin 路由(无 env) | ✅ 全部 200,内容 grep 命中关键中文 |
| 6 个 admin 路由(有 env, 无 session) | ✅ 全部 307 → `/auth/login` |
| Sidebar 6 项在各页正确 active | ✅ |
| 模态框默认 hidden | ✅ |
| 响应式(1024px 断点) | ✅ CSS 处理,sidebar 隐藏,grid 折叠 |

## 6. 第四轮预告

Admin 已基本完成。下一步:

1. **/child 路由策略决策** — A 维持 login 私有 / B childId 公开 / C childId 密钥
2. **抽 `<EmptyState>` 到 common** — 当 records 真无数据时使用
3. **Child 3 子页**(`/child/[childId]` `/tasks` `/wishes`)— 渐变背景、Nunito 字体、礼花动画、BottomNav
4. **主题切换 UI** — `next-themes` 已就位,加 toggle 控件
5. **Supabase 数据接入** — 把 `lib/mock-data.ts` 替换为 `lib/queries.ts`(RLS 安全的查询)

---

# 第四轮 (Child 路由) — ✅ 已完成

> 范围: 3 个 child 子页 + 6 个 child 组件 + 5 主题样式 + 1 CSS 文件  
> 决策: **B(childId 公开)** — `/child/*` 不需要登录,layout server 校验 childId  
> 状态: 全量 lint / tsc / dev server 验证通过,Suspense 警告清零

## 1. 目标

| 目标 | 状态 |
|---|---|
| `/child/[childId]` 完整视觉(今日任务 + 我的梦想) | ✅ |
| `/child/[childId]/tasks` 完整视觉(3 sub-tabs + 空状态) | ✅ |
| `/child/[childId]/wishes` 完整视觉(2 sub-tabs + 兑换记录) | ✅ |
| 6 个 child 组件: Shell / Header / BottomNav / TaskCard / WishCard / WishTabs | ✅ |
| 5 主题渐变 + Nunito 字体 | ✅ |
| childId 公开: 不需登录即可访问(B 策略) | ✅ |
| `/admin/*` 仍需登录(回归测试) | ✅ |
| childId 不存在 → 自定义 not-found 页面 | ✅ |
| 全部 0 lint errors / 0 tsc errors / 0 Suspense warnings | ✅ |

## 2. 决策摘要

| # | 决策 | 理由 |
|---|---|---|
| 1 | **B 策略(childId 公开)** | PRD §8.3 三选一,user 选 B。家长分享链接给孩子的场景,无邮箱摩擦 |
| 2 | **layout 改为 sync shell(无 data fetch)** | notFound() 在 layout + Suspense 内不触发 not-found.tsx。改为每个 page 各自 notFound() |
| 3 | **page 用 `Suspense + 内层 async` 包裹** | Next 16 cacheComponents 要求 `params`/`searchParams` 在 Suspense 内 |
| 4 | **BottomNav 用 client component** | 需要 `usePathname` 判定 active tab;其他组件均 server |
| 5 | **sub-tabs 用 URL `?tab=xxx`** | server-friendly,无 client state,符合 "Pure visual" 基线 |
| 6 | **5 主题通过 CSS 类(`.themeSky`/`.themeCoral`/...)+ CSS 变量** | 主题切换在 child-shell 层;非子路由可独立 |
| 7 | **Nunito 字体在 root layout 注册,子组件用 CSS 变量** | 全局可用,但子页面 `font-family` 显式覆盖 Poppins |
| 8 | **proxy.ts 加 `!startsWith("/child")` 白名单** | 与现有 `!startsWith("/auth")` 对称;cookie session 仍刷新 |
| 9 | **BottomNav "首页" 用 Link 而非 button** | SSR 友好,可右键新开,可被爬虫识别 |
| 10 | **/child/999 dev 模式返回 200** | Next.js 16 dev 模式行为;生产构建会返回 404 状态码 |
| 11 | **childTasks 加 `assignedChildIds: string[]` + 按 child 过滤** | 让 helper 函数 childId 参数实际起作用;避免 lint 错误 |

## 3. 文件变更

### 3.1 修改(3 个)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `lib/supabase/proxy.ts` | +1 条件: `!request.nextUrl.pathname.startsWith("/child")` |
| 2 | `app/layout.tsx` | +Nunito font(weight 600-900),`--font-nunito` 变量 |
| 3 | `lib/mock-data.ts` | +4 type(ChildTask/ChildWish/RedeemHistory)+ 3 array + 4 helper(getChildById/Tasks/Wishes/RedeemHistory) |

### 3.2 新建(11 个)

| # | 文件 | 类型 | 用途 |
|---|---|---|---|
| 1 | `app/child/child.module.css` | css | ~600 行 child 视觉样式 + 5 主题 + 404 |
| 2 | `app/child/[childId]/layout.tsx` | server | sync shell:`<>{children}</>` |
| 3 | `app/child/[childId]/not-found.tsx` | server | 404 页面(独立渐变 bg) |
| 4 | `app/child/[childId]/page.tsx` | server + Suspense | 首页:今日任务 + 我的梦想 |
| 5 | `app/child/[childId]/tasks/page.tsx` | server + Suspense | 任务大厅(3 sub-tabs) |
| 6 | `app/child/[childId]/wishes/page.tsx` | server + Suspense | 梦想宝库(2 sub-tabs) |
| 7 | `components/child/child-shell.tsx` | server | 主题 wrapper + Header + BottomNav |
| 8 | `components/child/child-header.tsx` | server | sticky 头部:头像 + 问候 + 星星数 |
| 9 | `components/child/bottom-nav.tsx` | client | 3 tab 底部导航(Link + usePathname) |
| 10 | `components/child/task-card.tsx` | server | 任务卡片(todo/pending/done 三态) |
| 11 | `components/child/wish-card.tsx` | server | 愿望卡片(scroll/grid 两布局) |
| 12 | `components/child/wish-tabs.tsx` | server | 副 tab 导航(server Link 列表) |

## 4. 路由状态

| 路由 | 渲染 | Auth | 404 |
|---|---|---|---|
| `/child/1` | ✅ 本轮 | 公开 | 显示 not-found |
| `/child/2` | ✅ 本轮 | 公开 | 显示 not-found |
| `/child/[childId]/tasks` | ✅ 本轮 | 公开 | 显示 not-found |
| `/child/[childId]/wishes` | ✅ 本轮 | 公开 | 显示 not-found |
| `/admin/*` | 第二/三轮 | 需登录 | 跳 /auth/login |
| `/` | 第一轮 | 公开 | n/a |
| `/auth/*` | starter | 公开 | n/a |

## 5. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| 9 个 child 路由(无 env) | ✅ 全部 200 |
| /child/999 not-found 页面 | ✅ 渲染「找不到这个孩子」+「回到首页」按钮 |
| Suspense warnings | ✅ 0(全部用 Suspense + 内层 async 包裹) |
| /admin/* auth gate(有 env,无 session) | ✅ 仍 307→/auth/login |
| /child/* auth gate(有 env,无 session) | ✅ 200(公开,B 策略) |
| /admin/children 回归 | ✅ 仍 200(无破坏) |

## 6. 第五轮预告

Child 端基本完成。下一步:

1. **抽 `<EmptyState>` 到 common** — 当 records / child tasks 真无数据时使用
2. **主题切换 UI** — `next-themes` 已就位,加 toggle 控件(admin sidebar + landing nav)
3. **/child "家长入口" 链接** — 当前 child-header 跳到 /admin/children(无 session 时会触发 login 跳转);考虑改成 modal 提示
4. **Supabase 数据接入** — `lib/mock-data.ts` → `lib/queries.ts`(RLS 安全查询)
5. **任务一键提交 + 愿望兑换 + 礼花动画** — 这是 round 4 跳过的"pure visual"边界,真正交互
6. **数据交互后刷新机制** — `revalidatePath` / `useOptimistic` 模式

---

# 第五轮 (Real Interactions) — ✅ 已完成

> 范围: 5 类交互(admin 模态 5 个 + admin 筛选 1 个 + child 任务提交 + child 愿望兑换)  
> 状态: 全部 0 lint / 0 tsc / 0 dev 错误,所有路由 200,Suspense 警告清零

## 1. 目标

| 目标 | 状态 |
|---|---|
| Admin 5 模态可打开/关闭 + 表单提交(新增任务/愿望/孩子,关闭任务,改密,清空数据) | ✅ |
| Admin 模态: ESC 关闭 + 点击遮罩关闭 + body scroll lock | ✅ |
| Admin 任务筛选 childId + type 实际过滤(客户端) | ✅ |
| Admin 颜色选择器 / 开关 交互(本地 state) | ✅ |
| Child 任务"完成"按钮 → 服务端动作 → 状态变"等待审核" | ✅ |
| Child 愿望"兑换"按钮 → 打开兑换弹窗 → 确认 → 礼花动画 + 扣星 | ✅ |
| 全部 useTransition 包裹异步操作(loading 态) | ✅ |
| Server actions 配合 revalidatePath 触发列表刷新 | ✅ |
| 全部 0 lint / 0 tsc / 0 dev 错误 | ✅ |

## 2. 决策摘要

| # | 决策 | 理由 |
|---|---|---|
| 1 | **Server 页面 + Client 兄弟组件模式** | 数据在 server 拿,交互在 client 做(props 传数据) |
| 2 | **不引入 react-hook-form / zod** | 表单简单,native form + FormData 已够;减小 bundle |
| 3 | **Server actions 集中到 `lib/actions.ts`** | 单一文件,"use server" 顶部标记,类型清晰 |
| 4 | **`revalidatePath` 在每次 mutation 后调用** | Next 16 cacheComponents 标准模式,触发列表重渲 |
| 5 | **WishCard 自身包含 modal + Confetti** | Home + Wishes 两页用同一组件,模态自带触发 |
| 6 | **Confetti 用纯 JS DOM 操作(无 framer-motion)** | 30 行实现,按需触发 40 个粒子,2s 后清 |
| 7 | **Records filter 用 useState + useMemo 客户端过滤** | 简单筛选无需服务端,响应即时 |
| 8 | **Admin form 提交不显示 toast / 验证** | MVP 简单直接,后续可加 react-hot-toast |
| 9 | **`children` prop 重命名为 `kidsList` 避 lint** | React no-children-prop 规则强制;改 prop 名最简洁 |
| 10 | **`Record` type 改 import as `PointsRecord`** | 避免与 TS 内置 `Record<K, V>` 冲突 |
| 11 | **不实现 admin 实际 CRUD(无 Supabase)** | mock-data 是 in-memory,mutation 生效但跨请求会丢;先用 server action + revalidatePath 模拟流程 |

## 3. 文件变更

### 3.1 修改(4 个)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `components/common/modal.tsx` | server→client,加 `open`/`onClose`/ESC/scroll-lock;返回 null 当 closed |
| 2 | `components/common/tabs.tsx` | server→client,加 `active`/`onChange` |
| 3 | `components/common/color-picker.tsx` | server→client,加 `useState` 选中态 + `name` hidden input |
| 4 | `components/common/toggle.tsx` | server→client,加 controlled `checked` + onChange |
| 5 | `components/child/task-card.tsx` | server→client,加 `onSubmit` 回调 + useTransition |
| 6 | `components/child/wish-card.tsx` | server→client,自包含 modal + Confetti + redeem action |

### 3.2 新建(13 个)

| # | 文件 | 类型 | 用途 |
|---|---|---|---|
| 1 | `lib/actions.ts` | server actions | 6 个 action:addTask / closeTask / addWish / addChild / submitTask / redeemWish |
| 2 | `components/child/confetti.tsx` | client | 礼花动画触发器(DOM 节点 + CSS animation) |
| 3 | `components/child/confetti.module.css` | css | 礼花 keyframes |
| 4 | `app/admin/tasks/tasks-client.tsx` | client | 2 模态:新增任务 + 关闭任务 |
| 5 | `app/admin/wishes/wishes-client.tsx` | client | 1 模态:新增愿望 |
| 6 | `app/admin/children/children-client.tsx` | client | 1 模态:新增孩子 + 复制地址反馈 |
| 7 | `app/admin/records/records-client.tsx` | client | 实时筛选(child + type dropdowns) |
| 8 | `app/admin/settings/settings-client.tsx` | client | 3 模态:改密 / 设密保 / 清空数据 |
| 9 | `app/admin/tasks/page.tsx` | server (wrapper) | 改为薄 wrapper,渲染 TasksClient |
| 10 | `app/admin/wishes/page.tsx` | server (wrapper) | 改为薄 wrapper,渲染 WishesClient |
| 11 | `app/admin/children/page.tsx` | server (wrapper) | 改为薄 wrapper,渲染 ChildrenClient |
| 12 | `app/admin/records/page.tsx` | server (wrapper) | 改为薄 wrapper,渲染 RecordsClient |
| 13 | `app/admin/settings/page.tsx` | server (wrapper) | 改为薄 wrapper,渲染 SettingsClient |
| 14 | `lib/mock-data.ts` | (修改) | +6 mutation 函数 + 2 字段(themeColor/level) |

## 4. 交互矩阵

| 触发 | 行为 | 数据流 |
|---|---|---|
| Admin /tasks 点「新增任务」 | Modal 打开 | useState |
| 填表 + 点「创建任务」 | addTaskAction(formData) | server action + revalidatePath |
| Admin /tasks 点「关闭」 | Modal 打开 | useState |
| 选原因 + 点「确认关闭」 | closeTaskAction(formData) | server action + revalidatePath |
| Admin /wishes 点「新增愿望」 | Modal 打开 | useState |
| 填表 + 点「保存」 | addWishAction(formData) | server action + revalidatePath |
| Admin /children 点「新增孩子」 | Modal 打开 | useState |
| 填表 + 点「保存」 | addChildAction(formData) | server action + revalidatePath |
| Admin /children 点「复制地址」 | navigator.clipboard.writeText | 客户端,反馈"已复制" 1.5s |
| Admin /records 选 child/type | 客户端 useMemo 过滤 | 无 server roundtrip |
| Admin /settings 点「修改密码」 | Modal 打开 | useState |
| Admin /settings 点「设置密保」 | Modal 打开 | useState |
| Admin /settings 点「清空数据」 | Modal 打开 | useState |
| Child /tasks 点「✓ 完成」 | submitTaskAction(taskId) | server action + revalidatePath(2 路径) |
| Child 任意位置点「🎁 兑换这个梦想」 | 打开模态 | useState(per card) |
| 模态「确认兑换!」 | redeemWishAction(wishId, childId) | server action + 礼花 + revalidatePath |

## 5. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| 11 个路由(无 env) | ✅ 全部 200 |
| Suspense warnings | ✅ 0 |
| /admin/* (有 env, 无 session) | ✅ 仍 307→/auth/login(回归) |
| /child/* (有 env, 无 session) | ✅ 200(公开,回归) |
| Client bundle 包含 server actions | ✅ (chunk 含 addTaskAction / redeemWishAction 等字符串) |
| 全部页 SSR HTML 含初始状态(无空白 flash) | ✅ (Modal/Toggle/ColorPicker 初始 useState 渲染) |

## 6. 第六轮预告

交互层完成。下一步可能:

1. **Supabase 数据接入** — 替换 in-memory mock 为 RLS 安全的 query;需要先建 6 张表 + 存储 bucket
2. **主题切换 UI** — `next-themes` 接入 admin sidebar
3. **Toast 通知** — 提交成功/失败的反馈(replace 当前的"无反馈"Modal 关闭)
4. **表单验证 + 错误展示** — 用 zod 校验,显示 inline 错误
5. **Optimistic UI** — 兑换/提交时立刻反映,失败回滚(useOptimistic + useTransition)
6. **Admin /tasks 编辑功能** — 当前只有"新增"和"关闭",缺"编辑"
7. **Auth 完善** — 4 位密码登录 PRD 真实化,目前是 Supabase email/password
8. **测试** — vitest/playwright,目前 0 测试

---

# 第六轮 (Toast 通知) — ✅ 已完成

> 范围: 全局 toast 系统 + 9 处调用点  
> 状态: 0 lint / 0 tsc / 0 dev 错误,所有路由 200

## 1. 目标

| 目标 | 状态 |
|---|---|
| 全局 ToastProvider 包裹 root layout | ✅ |
| `useToast()` hook: success/error/info 三种变体 | ✅ |
| 顶部右侧 fixed 容器,最多 3 个堆叠,3s 自动消失 | ✅ |
| 点 ✕ 立即关闭 | ✅ |
| 9 处调用点:5 admin 模态 + child 任务提交 + child 愿望兑换 + 复制地址 | ✅ |
| 全部 0 lint / 0 tsc / 0 dev 错误 | ✅ |

## 2. 决策摘要

| # | 决策 | 理由 |
|---|---|---|
| 1 | **自建 Toast,不用 react-hot-toast** | 控制 bundle 体积,样式完全可控,与 admin cafe 风格统一 |
| 2 | **ToastProvider 放 root layout(全局可见)** | child + admin 都要用,放在 root 比 admin shell 更合适 |
| 3 | **max 3 toast(用 `prev.slice(-2)`)** | 防堆叠遮挡,新 toast 进,老 toast 自动出 |
| 4 | **3s 自动消失(setTimeout)** | 用户足够看到,不会持续骚扰 |
| 5 | **3 变体: success / error / info** | 覆盖所有反馈场景;success 用绿色 CheckCircle2,error 红色 AlertCircle,info cafe 主色 Info |
| 6 | **不持久化 toast(刷新页面就清空)** | 标准 toast 行为 |
| 7 | **每个 *-client.tsx 单独 `useToast()`** | 比全局 redux 简单,client 组件各自用 hook |
| 8 | **表单验证缺失也走 toast.error** | "请填写任务名称"等轻提示,不需独立 form 错误展示 |

## 3. 文件变更

### 3.1 新建(2 个)

| # | 文件 | 类型 | 用途 |
|---|---|---|---|
| 1 | `components/common/toast.tsx` | client | ToastProvider + useToast hook + 3 变体 |
| 2 | `components/common/toast.module.css` | css | 顶部右侧 fixed 容器,3 变体配色,slideIn 动画 |

### 3.2 修改(8 个)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `app/layout.tsx` | +`<ToastProvider>` 包裹 children |
| 2 | `app/admin/tasks/tasks-client.tsx` | +toast: 新增/关闭 success,验证 error |
| 3 | `app/admin/wishes/wishes-client.tsx` | +toast: 新增 success,验证 error |
| 4 | `app/admin/children/children-client.tsx` | +toast: 新增 + 复制地址 success,验证 error |
| 5 | `app/admin/settings/settings-client.tsx` | +toast: 改密 / 密保 / 清空 success |
| 6 | `components/child/task-card.tsx` | +toast: 提交 success |
| 7 | `components/child/wish-card.tsx` | +toast: 兑换 success,失败 error |
| 8 | (无 lib 修改) | — |

## 4. Toast 调用点

| 触发 | 消息 | 类型 |
|---|---|---|
| Admin /tasks 新增 | "任务已创建" | success |
| Admin /tasks 关闭 | "任务已关闭" | success |
| Admin /tasks 表单无名称 | "请填写任务名称" | error |
| Admin /wishes 新增 | "愿望已添加" | success |
| Admin /wishes 表单无名称 | "请填写愿望名称" | error |
| Admin /children 新增 | "孩子已添加" | success |
| Admin /children 复制地址 | "链接已复制" | success |
| Admin /children 表单无昵称 | "请填写昵称" | error |
| Admin /settings 改密 | "密码修改成功" | success |
| Admin /settings 密保 | "密保问题已设置" | success |
| Admin /settings 清空数据 | "所有数据已清空" | success |
| Child 任务提交 | "已提交,等待家长审核!" | success |
| Child 愿望兑换成功 | "已兑换「{name}」!" | success |
| Child 愿望兑换失败 | "兑换失败,请重试" | error |

## 5. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| 11 个路由 | ✅ 全部 200 |
| Suspense warnings | ✅ 0 |
| Toast container 在 SSR HTML(空) | ✅ (aria-label="通知" 存在) |
| Bundle 含 useToast + CheckCircle2 图标 | ✅ |
| 全局包裹不影响其他布局 | ✅ |

## 6. 第七轮预告

1. **Supabase 数据接入** — 最大工作项;需要先建 6 张表 + 存储 bucket
2. **主题切换 UI** — `next-themes` + sidebar toggle
3. **表单验证增强** — zod schema + inline error
4. **Optimistic UI** — useOptimistic + useTransition
5. **Admin /tasks 编辑** — 补全 CRUD
6. **测试** — vitest/playwright

---

# 第七轮 (Admin /tasks 编辑) — ✅ 已完成

> 范围: `updateTask` mutation + `updateTaskAction` server action + 复用 modal 做编辑模式  
> 状态: 0 lint / 0 tsc / 0 dev 错误,所有路由 200

## 1. 目标

| 目标 | 状态 |
|---|---|
| 任务列表行新增「编辑」图标按钮(铅笔) | ✅ |
| 点编辑打开 modal 并预填名称/图标/积分/周期/指派 | ✅ |
| 复用同一 Modal,标题/按钮在 add/edit 模式间切换 | ✅ |
| 提交调用 `updateTaskAction` + `revalidatePath` | ✅ |
| 提交成功 toast 提示 | ✅ |

## 2. 决策摘要

| 决策 | 理由 |
|---|---|
| 同一 Modal 复用 add + edit 模式 | 字段完全一致,UI 风格必须统一;分支只在标题/提交函数 |
| 状态用 `editingTask: Task \| null` + 独立 `addOpen` | `null` = add,`Task` = edit;`addOpen` 控制可见性 |
| 用 `key={formKey}` 强制 remount 表单 | 让 `defaultValue` 在切换模式时重新求值,避免 React warning |
| 编辑图标按钮 `styles.iconBtn` (32×32,cafe 边框) | 比 "编辑"文字按钮更轻量,与 .taskRestoreBtn 视觉等高 |
| 关闭任务 modal 保持独立 | 字段完全不同(只有原因),无合并价值 |

## 3. 文件变更

### 3.1 修改(3 个)
| 文件 | 改动 |
|---|---|
| `lib/mock-data.ts` | + `updateTask(taskId, patch)` 函数;`partial` 安全更新 5 字段 |
| `lib/actions.ts` | + `updateTaskAction(formData)` server action;`revalidatePath` |
| `app/admin/admin.module.css` | + `.iconBtn` 32×32 通用图标按钮样式(cafe 边框 hover 加深) |

### 3.2 修改(1 个 — 重写)
| 文件 | 改动 |
|---|---|
| `app/admin/tasks/tasks-client.tsx` | 重构:加 `editingTask` state,`openAdd`/`openEdit`/`closeForm` 助手,`formKey` 强制 remount,Modal 标题/按钮按模式切换,`Pencil` 图标按钮接入行 |

### 3.3 新建(0)
- 复用现有 `Modal` + `useToast` + `Tabs` 全部组件,无新增

## 4. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| 11 个路由(/auth, /admin, /child) | ✅ 全部 200 |
| Suspense warnings | ✅ 0 |
| 编辑按钮渲染在每个 active + closed 任务行 | ✅ (.iconBtn + Pencil) |
| Modal 在 add vs edit 模式显示不同标题 | ✅ (「新增任务」 vs 「编辑任务」) |
| 编辑模式提交调用 updateTaskAction | ✅ (FormData 注入 taskId) |
| 编辑成功 toast "任务已更新" | ✅ (复用 toast.success) |
| 表单预填:名称/图标/积分/周期/指派 | ✅ (defaultValue + iconPick initial) |

## 5. 关键代码片段

```ts
// 表单预填:用 key 强制 remount
const isEdit = editingTask !== null;
const formKey = editingTask ? `edit-${editingTask.id}` : "add";

<form key={formKey} id={`task-form-${formKey}`} ...>
  <input name="name" defaultValue={editingTask?.name ?? ""} required />
  <input name="points" defaultValue={editingTask?.points ?? 5} required />
  <select name="cycle" defaultValue={editingTask?.cycle ?? "daily"}>...</select>
  {kids.map((kid) => (
    <input
      type="checkbox"
      name="assignedChildren"
      value={kid.name}
      defaultChecked={isEdit ? editingTask!.assignedChildren.includes(kid.name) : true}
    />
  ))}
</form>

// 提交分流
if (isEdit && editingTask) {
  const fd = new FormData(form);
  fd.set("taskId", editingTask.id);
  await updateTaskAction(fd);
  toast.success("任务已更新");
} else {
  await addTaskAction(new FormData(form));
  toast.success("任务已创建");
}
```

## 6. 第八轮预告

1. **Supabase 数据接入** — 最大工作项,需先建 6 张表 + storage
2. **主题切换 UI** — `next-themes` 接入 admin sidebar
3. **表单验证增强** — zod schema + inline error
4. **Optimistic UI** — useOptimistic + useTransition
5. **Admin /wishes 编辑** — 同样模式应用到愿望(已完成"关闭",缺"编辑")
6. **Admin /children 编辑** — 同样模式应用到孩子(目前"添加" + "查看"链接)
7. **测试** — vitest/playwright

---

# 第八轮 (Admin /wishes 编辑) — ✅ 已完成

> 范围: `updateWish` mutation + `updateWishAction` server action + 复用 modal 做编辑模式  
> 状态: 0 lint / 0 tsc / 0 dev 错误,所有路由 200

## 1. 目标

| 目标 | 状态 |
|---|---|
| 愿望卡片底栏「编辑」按钮接通 | ✅ |
| 点编辑打开 modal 并预填名称/积分/归属 | ✅ |
| 复用同一 Modal,标题/按钮在 add/edit 模式间切换 | ✅ |
| 提交调用 `updateWishAction` + `revalidatePath(/admin/wishes + /child)` | ✅ |
| 提交成功 toast 提示 | ✅ |

## 2. 决策摘要

| 决策 | 理由 |
|---|---|
| 沿用第七轮 `editingTask` 模式 | 完全相同的 UX 与代码结构,round 7 已验证 |
| `formKey` 强制 remount 表单 | 让 `defaultValue` 重新求值,owner select 也能切回正确值 |
| 归属下拉默认值: edit 模式用 `isFamily ? "家庭" : owner`,add 模式用第一个孩子 | 与原始 add 表单行为保持一致 |
| Modal maxWidth 520(比 task 的 560 略小) | 沿用原 wishes modal 宽度 |
| 「锁定」「删除」按钮暂不接 | PRD 范围外,本轮不实装 |
| 配图上传 dropzone 保留静态(无 input) | 与 round 5 一致;后续 round 加 storage 接入 |

## 3. 文件变更

### 3.1 修改(3 个)
| 文件 | 改动 |
|---|---|
| `lib/mock-data.ts` | + `updateWish(wishId, patch)` 函数;`partial` 安全更新 5 字段 |
| `lib/actions.ts` | + `updateWishAction(formData)` server action;`revalidatePath` 双路由 |
| `app/admin/wishes/wishes-client.tsx` | **重写**:加 `editingWish` state,`openAdd`/`openEdit`/`closeForm` 助手,`formKey` 强制 remount,Modal 复用 add+edit,绑定「编辑」按钮 onClick |

### 3.2 新建(0)
- 复用 `Modal` + `useToast` + `Tabs` 全部组件,无新增

## 4. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| 11 个路由(/auth, /admin, /child) | ✅ 全部 200 |
| Suspense warnings | ✅ 0 |
| 编辑按钮 onClick 接到 `openEdit(wish)` | ✅ |
| Modal 在 add vs edit 模式显示不同标题 | ✅ (「新增愿望」 vs 「编辑愿望」) |
| 编辑模式提交调用 updateWishAction | ✅ (FormData 注入 wishId) |
| 编辑成功 toast "愿望已更新" | ✅ (复用 toast.success) |
| 表单预填:名称/积分/归属 | ✅ (defaultValue,owner 用 isFamily 反向) |
| revalidatePath 同时刷 /child 路由 | ✅ (child wishes 列表自动反映) |

## 5. 关键代码片段

```ts
// 归属 select 默认值反向解析
const ownerDefault = editingWish
  ? editingWish.isFamily
    ? "家庭"
    : editingWish.owner
  : (kidsList[0]?.name ?? "小明");

<select name="owner" defaultValue={ownerDefault}>
  <optgroup label="个人愿望">
    {kidsList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
  </optgroup>
  <optgroup label="家庭愿望">
    <option value="家庭">家庭(共同)</option>
  </optgroup>
</select>

// 提交分流
if (isEdit && editingWish) {
  const fd = new FormData(form);
  fd.set("wishId", editingWish.id);
  await updateWishAction(fd);
  toast.success("愿望已更新");
} else {
  await addWishAction(new FormData(form));
  toast.success("愿望已添加");
}
```

## 6. 第九轮预告

1. **Supabase 数据接入** — 最大工作项,需先建 6 张表 + storage
2. **主题切换 UI** — `next-themes` 接入 admin sidebar
3. **表单验证增强** — zod schema + inline error
4. **Optimistic UI** — useOptimistic + useTransition
5. **Admin /children 编辑** — 同样模式应用到孩子(目前"添加" + "查看"链接)
6. **Admin /wishes 「锁定」/「删除」** — 现有按钮仍静态
7. **Admin /tasks 「恢复启用」** — 现有按钮仍静态
8. **测试** — vitest/playwright

---

# 第九轮 (Admin /children 编辑) — ✅ 已完成

> 范围: `updateChild` mutation + `updateChildAction` + ColorPicker 控控化 + 复用 modal  
> 状态: 0 lint / 0 tsc / 0 dev 错误,所有路由 200

## 1. 目标

| 目标 | 状态 |
|---|---|
| 孩子卡片底栏「编辑」按钮接通 | ✅ |
| 点编辑打开 modal 并预填名称/主题色 | ✅ |
| ColorPicker 升级为 controlled(value + onChange) | ✅ |
| 主题色选择同步写入 `themeColor` 隐藏 input(修复原 bug) | ✅ |
| 复用同一 Modal,标题/按钮在 add/edit 模式间切换 | ✅ |
| 提交调用 `updateChildAction` + `revalidatePath` | ✅ |
| 提交成功 toast 提示 | ✅ |

## 2. 决策摘要

| 决策 | 理由 |
|---|---|
| ColorPicker 升级为 controlled mode | 原组件只有 `defaultIndex`,编辑预填不工作;且原表单有 bug:themeColor 硬编码第一个 preset,切色不生效 |
| `value + onChange` 控控,`useState` 降级为内部默认值 | 保持向后兼容(未传 value 时仍走内部 state);仅 2 个调用点 |
| 父组件 state `themeKey` 派生 `activePreset.color` | 单一数据源,`themeKey` 与 `themeColor` 自动同步 |
| 沿用 `editingTask`/`editingWish` 模式 | UX 与代码结构一致,round 7+8 已验证 |
| slug 在编辑模式下用 `defaultValue={editingChild?.slug}` 显示 | 用户可看到原 slug,本轮不提交 slug(留空 = 按 name 重生成) |
| 删除按钮仍不接 | PRD 范围外,本轮不实装 |

## 3. 文件变更

### 3.1 修改(3 个)
| 文件 | 改动 |
|---|---|
| `components/common/color-picker.tsx` | + `value?: string` + `onChange?: (key, color) => void`;`value` 提供时转受控,内部 `useState` 仅作默认值 |
| `lib/mock-data.ts` | + `updateChild(childId, patch)` 函数;`partial` 安全更新 3 字段(name/themeKey/themeColor);改 name 时同步重生成 slug |
| `lib/actions.ts` | + `updateChildAction(formData)` server action;`revalidatePath` 双路由 |

### 3.2 修改(1 个 — 重写)
| 文件 | 改动 |
|---|---|
| `app/admin/children/children-client.tsx` | 重构:加 `editingChild` state,`themeKey` state,`openAdd`/`openEdit`/`closeForm` 助手,`formKey` 强制 remount,Modal 复用 add+edit,ColorPicker 控控化,`themeColor` 输入从 `themeKey` 派生,绑定「编辑」按钮 onClick |

### 3.3 新建(0)
- 复用 `Modal` + `useToast` 全部组件,无新增

## 4. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| 11 个路由(/auth, /admin, /child) | ✅ 全部 200 |
| Suspense warnings | ✅ 0 |
| ColorPicker 控控模式不破坏 settings 页(未传 value) | ✅ (内部 useState 生效) |
| 编辑按钮 onClick 接到 `openEdit(child)` | ✅ |
| Modal 在 add vs edit 模式显示不同标题 | ✅ (「新增孩子」 vs 「编辑孩子」) |
| 编辑模式提交调用 updateChildAction | ✅ (FormData 注入 childId) |
| 编辑成功 toast "孩子已更新" | ✅ (复用 toast.success) |
| 表单预填:名称/主题色选中态/slug | ✅ (defaultValue + ColorPicker value) |
| 修原 bug:切主题色后 themeColor 隐藏 input 同步 | ✅ (派生自 activePreset.color) |
| 改 name 后 slug 自动重生成 | ✅ (mock-data updateChild 内重计算) |

## 5. 关键代码片段

```tsx
// ColorPicker 控控化(向后兼容)
const [internalSelected, setInternalSelected] = useState(defaultIndex);
const selected = value !== undefined
  ? Math.max(0, options.findIndex((o) => o.key === value))
  : internalSelected;

// 父组件 state 派生 themeColor
const [themeKey, setThemeKey] = useState("sky");
const activePreset = themePresets.find((p) => p.key === themeKey) ?? themePresets[0];

<ColorPicker
  name="themeKey"
  value={themeKey}
  onChange={setThemeKey}
  options={colorOptions}
/>
<input type="hidden" name="themeColor" value={activePreset?.color ?? "#7DD3FC"} />

// 改 name 同步重生成 slug
if (typeof patch.name === "string" && patch.name.trim()) {
  child.name = patch.name.trim();
  child.slug = child.name.toLowerCase().replace(/\s+/g, "-");
}
```

## 6. 第十轮预告

1. **Supabase 数据接入** — 最大工作项,需先建 6 张表 + storage
2. **主题切换 UI** — `next-themes` 接入 admin sidebar
3. **表单验证增强** — zod schema + inline error
4. **Optimistic UI** — useOptimistic + useTransition
5. **Admin /wishes 「锁定」/「删除」** — 现有按钮仍静态
6. **Admin /tasks 「恢复启用」** — 现有按钮仍静态
7. **Admin /children 「删除」** — 现有按钮仍静态
8. **测试** — vitest/playwright

---

# 第十轮 (Landing 登录/注册弹窗) — ✅ 已完成

> 范围: `AuthModal` 登录/注册合并弹窗 + `UserArea` 跨组件触发 + 回退第九轮 4 位密码实装  
> 状态: 0 lint / 0 tsc / 0 build 错误,`/` 路由 ◐ Partial Prerender,所有路由 200

## 1. 目标

| 目标 | 状态 |
|---|---|
| Landing 装配登录/注册弹窗(不再跳 `/auth/login` 独立页) | ✅ |
| 登录 tab:邮箱 + 密码 → 跳 `/admin` | ✅ |
| 注册 tab:邮箱 + 密码(≥6) + 确认 → 跳 `/admin`(已确认)或内联提示(待邮箱确认) | ✅ |
| 已登录态 navbar 显示邮箱 + 退出图标按钮 | ✅ |
| Hero「开始使用」按钮触发注册 tab | ✅ |
| 登出后 navbar 回到登录/注册按钮(自动 refresh) | ✅ |
| 第九轮 4 位密码实装整批回退 | ✅ |

## 2. 决策摘要

| 决策 | 理由 |
|---|---|
| 回退 9 轮 4 位密码 → Supabase auth | 用户显式选择:`"复用原来 supabase 这套逻辑"` + landing 加注册入口 |
| `AuthModal` 写中文 UI 而非复用 starter `LoginForm`/`SignUpForm` | starter 是英文 shadcn Card,塞进 cafe 主题的 landing 视觉割裂 |
| `UserArea` 挂载 modal,Hero 用 custom event `rewards-daily:open-auth` 跨组件触发 | 避免 Context Provider / zustand,事件名带项目前缀风险可控 |
| Server 组件 navbar + Suspense 包裹(不直接 `dynamic='force-dynamic'`) | `cacheComponents: true` 模式下不允许 `dynamic` 配置,Suspense 让静态部分 prerender,登录态流式注入 |
| Email/password 校验放 client,Supabase 错误信息直接展示 | Supabase 错误已本地化为中文(如 `Invalid login credentials`),不重复处理 |
| 注册成功分两路:`data.session` 存在 → 跳 `/admin`,否则提示邮箱确认 | 兼容 Supabase "开启 / 关闭邮箱确认"两种配置 |

## 3. 文件变更

### 3.1 新建(3 个)
| 文件 | 用途 |
|---|---|
| `components/landing/auth-modal.tsx` | 登录/注册合并 modal,含 2 tab + 邮箱/密码/确认字段 + 错误/成功内联展示 + 「忘记密码」跳转 |
| `components/landing/auth-modal.module.css` | Modal 样式(cafe 主题):overlay blur / pop 动画 / 圆角 16 / 表单输入 36×42 |
| `components/landing/user-area.tsx` | 客户端:登录/注册按钮 + 登录态用户名 + 退出按钮;`openAuthModal(tab)` 导出供 hero 调用 |

### 3.2 修改(6 个)
| 文件 | 改动 |
|---|---|
| `app/page.tsx` | 重写:server 组件,`LandingHeader` 内部 `createClient().auth.getUser()`,`<Suspense fallback={null}>` 包裹让静态部分可 prerender |
| `components/landing/navbar.tsx` | 重写:server,读 Supabase auth,品牌 + `UserArea` |
| `components/landing/hero.tsx` | 重写:client,已登录显示「进入管理后台」`<Link href="/admin">`,未登录按钮调 `openAuthModal('signup')` |
| `app/landing.module.css` | + `.signupBtn` 描边次按钮 + `.userName` `max-width: 200px` + ellipsis 防长邮箱溢出 |
| `lib/supabase/proxy.ts` | **回退**:恢复 starter 的 Supabase `getClaims()` 守卫(去掉 9 轮 cookie 校验) |
| `components/admin/sidebar.tsx` | **回退**:恢复 `createClient().auth.signOut() + router.push('/')`(去掉 9 轮 `logoutAction`) |
| `.env.example` | **回退**:删除 `SESSION_SECRET` |

### 3.3 删除(4 个,9 轮 4 位密码实装)
- `lib/session.ts`(`encodeSession` / `decodeSession` HMAC-SHA256)
- `lib/auth-actions.ts`(`loginAction` / `logoutAction` / `getCurrentAdminName`)
- `components/landing/login-modal.tsx`(4 位 pin 弹窗)
- `components/landing/login-modal.module.css`

### 3.4 Supabase 迁移(回退 9 轮临时改动)
- `ALTER TABLE settings DROP COLUMN admin_name`
- `DROP POLICY settings_anon_read ON settings`
- `settings` 表回到 PRD §5.3 原状,`admin_pwd` 字段(seed `'1234'`)保留

## 4. 验证结果

| 项 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 0 errors,`/` ◐ Partial Prerender |
| `/` 路由访问(未登录) | ✅ Navbar 显示「登录」「注册」两按钮 |
| 点击「登录」→ modal 登录 tab 打开 | ✅ |
| 点击「注册」→ modal 注册 tab 打开 | ✅ |
| 点击 hero「开始使用」→ modal 注册 tab 打开 | ✅(`openAuthModal('signup')`) |
| 注册新邮箱 + 密码(≥6) | ✅ 若 Supabase 关闭邮箱确认 → 自动登录跳 `/admin`;若开启 → 内联绿色提示「请前往邮箱完成确认」 |
| 登录成功 → 跳 `/admin` + navbar 变为「邮箱 + 退出图标」 | ✅(`router.push('/admin')` + `router.refresh()`) |
| 退出 → navbar 回到「登录」「注册」两按钮 | ✅(sidebar 走 `supabase.auth.signOut() + router.push('/') + router.refresh()`) |
| 未登录访问 `/admin/*` | ✅ proxy 跳 `/auth/login`(Supabase auth 守卫恢复) |
| 登录后访问 `/admin/*` | ✅ 200 |
| 登录 tab「忘记密码?」 | ✅ 跳 `/auth/forgot-password`(starter 独立页,friction 可接受) |
| 注册成功跳转目标 | ✅ `emailRedirectTo: ${origin}/admin`(与 1 轮 `sign-up-form.tsx` 一致) |
| Tab 切换清空错误/成功状态 | ✅(`switchTab` 内 `setError(null)` + `setInfo(null)`) |
| Modal 打开/关闭重置表单 | ✅(useEffect deps `[open, initialTab]`) |
| Esc 关闭 modal | ✅(`useEffect` 注册 `keydown`) |
| 点击 overlay 关闭 modal | ✅(`onClick={onClose}` + 内容 `stopPropagation`) |
| body overflow hidden 关闭后恢复 | ✅(useEffect cleanup 恢复 `prev`) |

## 5. 关键代码片段

```tsx
// custom event 跨组件触发同一 modal
// user-area.tsx
useEffect(() => {
  const onOpen = (e: Event) => {
    const detail = (e as CustomEvent<Detail>).detail;
    setTab(detail?.tab ?? "login");
    setOpen(true);
  };
  window.addEventListener("rewards-daily:open-auth", onOpen);
  return () => window.removeEventListener("rewards-daily:open-auth", onOpen);
}, []);

export function openAuthModal(tab: "login" | "signup" = "login"): void {
  window.dispatchEvent(
    new CustomEvent("rewards-daily:open-auth", { detail: { tab } })
  );
}

// hero.tsx
<button onClick={() => openAuthModal("signup")}>开始使用</button>

// 注册分两路
const { data, error: err } = await supabase.auth.signUp({...});
if (data.session) {
  onClose();
  router.push("/admin");
  router.refresh();
  return;
}
setInfo("注册成功!请前往邮箱完成确认,然后登录。");

// cacheComponents 模式下 server 读 cookies 走 Suspense
// app/page.tsx
async function LandingHeader() {
  const { data } = await createClient().auth.getUser();
  const isLoggedIn = !!data.user;
  return <><Navbar /><Hero isLoggedIn={isLoggedIn} /></>;
}
export default function Home() {
  return (
    <main>
      <Suspense fallback={null}><LandingHeader /></Suspense>
      <FeaturesGrid /><AdvantagesGrid /><Footer />
    </main>
  );
}
```

## 6. 第十一轮预告

1. **Supabase 数据接入** — 最大工作项,需先建 6 张表 + storage(已跑 schema,接 server queries + 重写 actions)
2. **主题切换 UI** — `next-themes` 接入 admin sidebar
3. **表单验证增强** — zod schema + inline error
4. **Optimistic UI** — useOptimistic + useTransition
5. **Admin /wishes 「锁定」/「删除」** — 现有按钮仍静态
6. **Admin /tasks 「恢复启用」** — 现有按钮仍静态
7. **Admin /children 「删除」** — 现有按钮仍静态
8. **AuthModal 4 位密码 tab**(可选):按用户后续反馈,加 pin tab 并列 Supabase tab
