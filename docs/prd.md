# 家庭成长激励助手 Web版 V1\.0 最终PRD文档

## 文档说明：最终定稿｜可直接用于UI出图、前端开发落地

## 技术栈：Next\.js15\(App Router\) \+ Tailwind CSS \+ Supabase云端数据库

# 一、基础信息

## 1\.1 项目概述

本项目为响应式Web云端应用，无需自建后端，依托Supabase实现云端数据持久化、多设备同步。采用家长管理端\+孩子用户端双模式权限隔离架构，通过「任务\-积分\-愿望奖励」闭环体系，帮助家长培养孩子良好习惯，数据永久留存、支持备份恢复，轻量化开箱即用。

## 1\.2 核心技术方案

- 前端框架：Next\.js 15（App Router，服务端/客户端混合渲染）

- 样式方案：Tailwind CSS 全响应式布局，统一全局UI规范

- 数据存储：Supabase PostgreSQL云端数据库，替代LocalStorage，支持实时同步

- 资源存储：Supabase Storage托管头像、愿望配图，CDN加速访问

- 权限体系：Supabase RLS行级安全策略，精细化隔离家长/孩子数据权限

- 部署方式：Vercel前端部署 \+ Supabase云端数据服务部署

## 1\.3 全局统一交互规范

统一全站交互逻辑，摒弃冗余Tab错误逻辑，标准化操作方式：

- Tab唯一用途：仅用于页面内部数据筛选、视图切换，不做页面跳转

- 新增功能：统一页面右上角「新增按钮」，点击唤起弹窗表单

- 编辑功能：列表行内编辑按钮，点击弹窗回显表单编辑

- 删除/状态操作：行内快捷按钮，二次确认后执行

- 所有新增、编辑表单均为弹窗形式，不占用页面路由、不生成Tab

## 1\.4 双模式架构与权限

|模式|路由前缀|视觉风格|核心权限|
|---|---|---|---|
|家长管理端|/admin（登录专属，未登录拦截）|简约商务风，白底深蓝主色，功能优先|全量数据增删改查、任务审核、积分奖惩、数据备份、系统配置|
|孩子用户端|/child/\[childId\]（动态私有路由）|活泼卡通风，高饱和色彩，图形化展示|仅查看个人数据、提交任务审核，无任何编辑/删除权限，数据完全隔离|

## 1\.5 响应式适配规则

- **桌面端（≥1024px）**：家长端固定左右分栏，左侧导航常驻，右侧内容局部刷新

- **平板端（768px\-1024px）**：隐藏左侧导航，采用双列卡片\+顶部滑动Tab布局

- **移动端（\<768px）**：隐藏左侧导航，单列流式布局，顶部Tab横向可滑动

# 二、全站布局、导航与登录权限终极规范

## 2\.1 官网首页 Landing Page（公开页面）

**页面定位**：纯展示落地页，无后台功能、无模式入口，仅做产品介绍与登录引流，所有访客可自由访问。

**页面布局（从上至下流式居中）**

1. 顶部导航：左侧品牌Logo\+产品名称，右上角常驻【管理员登录】按钮（滚动固定）

2. 核心展示区：页面居中Slogan、产品核心定位介绍

3. 功能介绍区：图文展示任务养成、积分激励、愿望奖励四大核心能力

4. 优势说明区：云端存储、多设备同步、数据安全隔离等产品优势

5. 底部区域：版权说明、产品备注


**页面规则**：删除所有端入口按钮，孩子端无公开访问入口，仅后台内部可跳转。

## 2\.2 家长Admin后台布局（登录私有页面）

### 2\.2\.1 PC端标准布局（≥1024px）

固定**左侧常驻导航栏 \+ 右侧动态内容区**左右分栏结构，无整页刷新，仅局部渲染内容。

#### 左侧导航栏完整规范

- **尺寸规格**：固定宽度240px，100vh全屏高度，贴合页面顶底，无留白

- **布局结构**：顶部后台Logo\+名称、中部功能菜单、底部固定【退出登录】按钮

- **菜单结构**：统一「图标\+文字」横向布局，单条菜单高44px，左右内边距16px，圆角8px

- **固定菜单顺序**：控制台首页、任务管理、愿望管理、孩子管理、积分流水记录、系统设置

- **样式交互**：默认浅灰文字透明背景；hover浅灰底色高亮；激活态主色文字\+主色浅透底\+左侧4px高亮竖线；点击仅切换右侧内容，侧边栏状态不重置

#### 右侧内容区规范

自动适配剩余页面宽高，承载所有页面内容，包含页面标题、操作按钮、筛选Tab、统计卡片、数据列表、弹窗等，与左侧导航无重叠挤压。

**双层Tab隔离规则**：左侧导航为一级页面切换，内容区顶部Tab为二级数据筛选，两者逻辑独立、互不干扰。

### 2\.2\.2 移动端布局（\<1024px）

- 完全隐藏左侧240px导航栏，页面全屏单列流式布局

- 保留页面顶部横向可滚动筛选Tab，左右滑动切换视图，解决小屏挤压问题

- 所有组件自适应适配，完整保留全部操作、展示功能

## 2\.3 孩子端页面布局与访问规则

- **访问权限**：无公开入口，仅家长后台可跳转/分享专属链接，游客、未登录用户禁止访问

- **全局布局**：全设备统一单列布局，底部常驻4个一级Tab：我的首页、任务大厅、梦想宝库

- **权限限制**：仅可查看个人数据、提交任务，无任何管理、编辑、删除权限，数据严格隔离

## 2\.4 全站权限流转逻辑

- 未登录：仅可访问首页，拦截所有/admin、/child私有路由，自动跳转首页

- 家长登录：放行全部后台路由，拥有全量管理权限

- 孩子访问：仅个人专属路由可见，只能操作个人数据，无法查看其他孩子信息

# 三、家长Admin后台页面详情

## 3\.1 控制台首页（/admin）

无页面Tab，纯数据展示页

核心模块：

1. 顶部统计卡片区：今日待审核任务数、孩子总积分、今日已完成任务、待达成愿望数

2. 主体待审核任务列表：展示任务信息、提交人、时间，支持通过/拒绝操作

3. 悬浮快捷操作：手动加分、手动扣分

4. 功能按钮：右上角进入孩子模式入口

5. 空状态：暂无待审核任务友好提示

## 3\.2 任务管理页（/admin/tasks）

二级筛选Tab：【全部任务】【启用任务】【已关闭任务】（PC平铺、移动端滑动）

页面结构：顶部Tab筛选\+新增任务按钮、主体任务列表（桌面表格/移动端卡片）、行内编辑/启用/删除操作

弹窗表单：任务名称、图标选择、积分设置、执行周期、自动审核开关

## 3\.3 愿望管理页（/admin/wishes）

二级筛选Tab：【全部愿望】【个人愿望】【家庭愿望】（PC平铺、移动端滑动）

页面结构：顶部Tab筛选\+新增愿望按钮、主体愿望卡片列表、行内编辑/锁定/删除操作

弹窗表单：默认图标选择、愿望名称、目标积分、归属选择（个人/家庭）

## 3\.4 孩子管理页（/admin/children）

无页面Tab

页面结构：顶部批量删除按钮、孩子网格卡片列表（头像、昵称、积分、主题色）、卡片切换查看/编辑/删除操作

弹窗表单：头像上传、昵称修改、主题色选择；新增孩子自动生成专属独立路由

## 3\.5 积分流水记录页（/admin/records）

无页面Tab

页面结构：顶部孩子/时间/积分类型筛选栏、主体流水列表、数据导出功能

列表展示：操作时间、关联孩子、关联任务/愿望、积分变动、备注原因

## 3\.6 系统设置页（/admin/settings）

无页面Tab，分组式布局

核心分组：安全设置（改密码、密保）、数据管理（备份/恢复/清空）、个性化设置（主题色、音效）、辅助功能（反馈、关于）

# 四、孩子端页面详情

全局底部固定一级Tab：我的首页、任务大厅、梦想宝库

## 4\.1 我的首页（/child/\[childId\]）

无二级Tab

核心模块：顶部个人信息（头像、昵称、等级、总积分）、主推愿望进度卡片、今日成就数据、右上角家长入口

## 4\.2 任务大厅（/child/\[childId\]/tasks）

二级筛选Tab：【可做任务】【审核中】【已完成】（PC平铺、移动端滑动，默认可做任务）

极简一键提交按钮核心模块：顶部筛选\+刷新、两列瀑布流任务卡片、**任务卡片内直接一键提交**、状态标识、空状态鼓励文案。**取消弹窗、取消图片上传**，孩子提交任务极简操作，点击提交即进入待审核状态。

## 4\.3 梦想宝库（/child/\[childId\]/wishes）

无二级Tab

# 五、Supabase云端数据库方案

## 5\.1 存储架构

废弃本地存储，采用PostgreSQL数据库\+对象存储双云端架构，数据永久留存、多设备同步，RLS权限严格隔离数据。

## 5\.2 存储桶配置

- avatar：存储孩子头像图片

## 5\.3 核心数据表结构

所有表默认携带create\_at、update\_at字段，用于数据追溯排序

### 表1：settings 全局配置表

|字段名|类型|主键|说明|
|---|---|---|---|
|id|bigint|是|自增主键|
|admin\_pwd|varchar|否|家长登录密码|
|security\_answer|text|否|密保问题答案|
|global\_theme|varchar|否|全局主题色标识|
|sound\_open|boolean|否|音效开关状态|

### 表2：children 孩子信息表

|字段名|类型|主键|说明|
|---|---|---|---|
|id|bigint|是|自增主键|
|name|varchar|否|孩子昵称|
|avatar\_url|text|否|头像CDN地址|
|theme\_color|varchar|否|专属主题色|
|total\_points|int|否|累计总积分|
|level|int|否|成长等级|

### 表3：tasks 任务配置表

|字段名|类型|主键|说明|
|---|---|---|---|
|id|bigint|是|自增主键|
|name|varchar|否|任务名称|
|icon|varchar|否|图标标识|
|points|int|否|任务奖励积分|
|type|varchar|否|任务分类：生活/学习/家务/品格|
|cycle|varchar|否|执行周期：daily/weekly/once|
|||||
|auto\_check|boolean|否|是否开启自动审核|
|status|boolean|否|任务启用/停用状态|

### 表4：task\_audit 任务审核表

|字段名|类型|主键|说明|
|---|---|---|---|
|id|bigint|是|自增主键|
|child\_id|bigint|否|关联孩子ID|
|task\_id|bigint|否|关联任务ID|
|submit\_time|timestamp|否|任务提交时间|
|||||
|audit\_status|varchar|否|审核状态：pending/agree/refuse|

### 表5：wishes 愿望表

|字段名|类型|主键|说明|
|---|---|---|---|
|id|bigint|是|自增主键|
|name|varchar|否|愿望名称|
|||||
|target\_points|int|否|兑换所需积分|
|child\_id|bigint|否|关联孩子ID，空为家庭愿望|
|is\_family|boolean|否|是否家庭公共愿望|
|is\_lock|boolean|否|是否锁定禁用|
|is\_target|boolean|否|是否当前主推目标|
|is\_finish|boolean|否|是否已兑换完成|

### 表6：points\_records 积分流水表

|字段名|类型|主键|说明|
|---|---|---|---|
|id|bigint|是|自增主键|
|child\_id|bigint|否|关联孩子ID|
|related\_id|bigint|否|关联任务/愿望ID|
|record\_type|varchar|否|积分类型：income收入/out支出|
|points|int|否|积分变动数值|
|remark|text|否|变动备注说明|
|create\_time|timestamp|否|变动时间|

## 5\.4 RLS权限管控规则

- 家长端：全数据表CRUD权限，可管理所有数据、资源

- 孩子端：仅可读个人数据、可提交个人任务审核，禁止读写其他孩子数据、禁止配置类操作

- 存储权限：家长可上传/删除所有图片，读取公开资源

## 5\.5 前端对接配置

根目录环境变量配置Supabase服务：

```Plain Text
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目地址
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

统一封装lib/supabase\.ts工具，全局处理数据库增删改查、图片上传逻辑。

# 六、全局UI规范（Tailwind CSS）

## 6\.1 色彩规范

- 家长端主色：深蓝系列（bg\-blue\-600 / text\-blue\-700）

- 孩子端主色：紫粉系列（bg\-purple\-500 / bg\-pink\-400）

- 成功状态：绿色（bg\-green\-500）

- 警告/拒绝：红色（bg\-red\-500）

- 中性底色：bg\-gray\-50、bg\-white

## 6\.2 通用布局组件规范

- 页面容器：max\-w\-7xl mx\-auto px\-4 sm:px\-6 lg:px\-8

- 通用卡片：bg\-white rounded\-xl shadow\-sm p\-4

- 主按钮：px\-4 py\-2 rounded\-lg font\-medium bg\-blue\-600 text\-white hover:bg\-blue\-700

- 次按钮：px\-4 py\-2 rounded\-lg font\-medium bg\-gray\-100 text\-gray\-700 hover:bg\-gray\-200

# 七、全站核心路由清单

- 官网首页：/

- 家长控制台：/admin

- 任务管理：/admin/tasks

- 愿望管理：/admin/wishes

- 孩子管理：/admin/children

- 积分记录：/admin/records

- 系统设置：/admin/settings

- 孩子专属首页：/child/\[childId\]
- 孩子任务大厅：/child/\[childId\]/tasks
- 孩子梦想宝库：/child/\[childId\]/wishes

---

# 八、本轮实施偏差与当前状态

> 本节记录每轮实施对 PRD 的偏离,作为后续对齐的参照。所有偏离都是**临时占位**,目标态以正文 PRD 为准。

## 8.1 Auth 方案偏离(临时)

**PRD §2.1 / §5.3 / §5.5 目标态**: 家长登录使用 `settings.admin_pwd` 字段存储的 4 位数字密码,Supabase 提供数据存储,登录态由 4 位密码校验后写入 session/cookie。

**本轮(第十轮)实施**: `settings` 表已落地(seeded with `admin_pwd='1234'`),但用户明确决定**继续沿用 Supabase Auth**(邮箱 + 密码)作为 MVP 路径。第九轮曾经尝试实现 4 位密码(新增 `lib/session.ts` / `lib/auth-actions.ts` / `login-modal.tsx` + HMAC cookie + `proxy.ts` 切 cookie 校验 + `admin_name` 列),第十轮整批回退。

**当前态**:
- `lib/supabase/proxy.ts` 仍用 `supabase.auth.getClaims()` 守卫 `/admin/*`
- Landing 装配 Supabase 登录/注册 modal(`AuthModal`),登录/注册成功后跳 `/admin`
- Admin sidebar 退出登录走 `supabase.auth.signOut()`
- `settings.admin_pwd` 字段保留(可由 `clearAllDataAction` / 后续 `changePasswordAction` 维护),`admin_name` 字段已 drop(原第九轮加的)

**回归路径**: 仍按 V1.0 目标态做 4 位密码切换,但用户已显式说明"先把 Supabase auth 用起来,4 位密码后续再说"。具体步骤:
1. 在 `lib/auth-actions.ts` 写 `loginAction` / `logoutAction`(`admin_session` cookie,HMAC-SHA256 签名)
2. `AuthModal` 加 4 位 pin tab(并列 Supabase tab),命中 `settings.admin_pwd` 写 cookie
3. `lib/supabase/proxy.ts` 改 cookie 校验,移除 Supabase auth 守卫
4. `isAdminSession()` 替换 admin layout 的 RSC 二次校验

## 8.2 Landing 登录/注册弹窗(临时)

**PRD §2.1 目标态**: landing navbar 与 hero 上的「管理员登录 / 开始使用」按钮唤起 4 位密码弹窗,弹窗内嵌「忘记密码 → 密保问题」二级展开。

**本轮(第十轮)实施**: 按钮唤起 `AuthModal`(中文 UI,匹配 landing 视觉),含两个 tab:
- **登录**:邮箱 + 密码,提交 → `supabase.auth.signInWithPassword()` → 关弹窗 + `router.push('/admin')` + `router.refresh()`
- **注册**:邮箱 + 密码(≥6) + 确认密码,提交 → `supabase.auth.signUp({ options: { emailRedirectTo: ${origin}/admin } })`;若 `data.session` 已建(自动确认)→ 跳 `/admin`,否则内联提示「请前往邮箱完成确认,然后登录」

辅助入口:
- 登录 tab「忘记密码?」→ 关弹窗 + `router.push('/auth/forgot-password')`(沿用 starter 独立页,本轮不内嵌)
- Tab 切换「立即注册 / 去登录」按钮

**回归路径**: 见 §8.1,4 位密码切换时改为 4 位 pin tab(与 Supabase tab 并列,或替换 Supabase tab)。

## 8.3 /child 路由策略(已决定: B)

**PRD §2.3 目标态**: 孩子端为登录私有路由,游客/未登录用户禁止访问,仅家长后台可跳转或分享专属链接。

**第四轮决定**: 选 **B(childId 公开)** — 任意人输入 `/child/[childId]` 都可访问,layout 校验 childId 在 mock `children` 数组中存在即放行。`lib/supabase/proxy.ts` 在 redirect 条件中加 `!startsWith("/child")` 白名单。

**未选**: (A) 登录私有 — 孩子需用家长账号登录,friction 太大;(C) childId 密钥 — 增加 admin share UI + child input UI 复杂度,B 足够 MVP。

## 8.4 数据接入(临时)

**PRD §5 目标态**: 6 张表(settings / children / tasks / task_audit / wishes / points_records)+ RLS 完整,前端通过 Supabase 实时读写。

**本轮实施**: 无 Supabase 表结构,所有页面用静态 mock 数据(`lib/mock-data.ts` 待补,目前仅 `/admin` 占位页用真实 Supabase 拿 user.email)。

## 8.5 设计 Token 偏离

**PRD §6.1 目标态**: 家长端主色深蓝(bg-blue-600 / text-blue-700),孩子端主色紫粉(bg-purple-500 / bg-pink-400)。

**本轮实施**: 家长端主色沿用 `design/index.html` 的 Cafe 棕 `#5D4432`(与 PRD §6.1 偏离),以匹配 `design/shared.css`。后续若 PRD 更新同步设计稿,可一键把 `--primary` 切回深蓝。

## 8.6 当前文件状态(累计两轮)

### 第一轮(7 修改 + 9 新建)

**修改原项目文件(7 个)**:
- `tailwind.config.ts` `app/globals.css` `app/layout.tsx` `app/page.tsx`
- `components/login-form.tsx` `components/sign-up-form.tsx` `components/logout-button.tsx`

**新建(9 个)**:
- `app/admin/layout.tsx` `app/admin/page.tsx` `app/landing.module.css`
- `components/landing/{navbar,hero,features-grid,advantages-grid,footer}.tsx`
- `docs/implementation-plan.md`

### 第二轮(1 修改 + 12 新建)

**修改原项目文件(1 个)**:
- `app/admin/page.tsx`(占位 → 完整 dashboard)

**新建(12 个)**:
- `app/admin/admin.module.css`
- `lib/mock-data.ts`
- `components/admin/{admin-shell,sidebar,page-header,stat-card,stats-grid,review-item,review-list,review-section,floating-actions,point-adjustment-modal}.tsx`
- `docs/superpowers/specs/2026-06-02-admin-shell-dashboard-design.md`

### 累计未触碰的 starter 文件(后续清理)

- `app/auth/*`(除第一轮 3 个 redirect 改动外)
- `app/protected/*` `components/tutorial/*`
- `components/{deploy-button,env-var-warning,hero,next-logo,supabase-logo,theme-switcher,forgot-password-form,update-password-form}.tsx`
- `lib/supabase/*` `proxy.ts` `next.config.ts` `tsconfig.json`

### 第三轮(0 修改原项目 + 9 新建)

**修改(2 个)**:
- `lib/mock-data.ts`(扩展实体)
- `app/admin/admin.module.css`(扩展样式)

**新建(9 个)**:
- `components/common/{tabs,modal,color-picker,toggle}.tsx`
- `app/admin/{tasks,wishes,children,records,settings}/page.tsx`

### 第四轮(3 修改 + 12 新建,选 B 策略)

**修改(3 个)**:
- `lib/supabase/proxy.ts`(+/child 白名单)
- `app/layout.tsx`(+Nunito font)
- `lib/mock-data.ts`(+child 实体 + 4 helper)

**新建(12 个)**:
- `app/child/child.module.css`
- `app/child/[childId]/{layout,not-found,page}.tsx`
- `app/child/[childId]/{tasks,wishes}/page.tsx`
- `components/child/{child-shell,child-header,bottom-nav,task-card,wish-card,wish-tabs}.tsx`

### 第五轮(交互层实装, 6 修改 + 13 新建)

**修改(6 个)**:
- `components/common/{modal,tabs,color-picker,toggle}.tsx`(server→client,加 useState/onChange)
- `components/child/{task-card,wish-card}.tsx`(+ onSubmit/redeem + 礼花 + useTransition)

**新建(13 个)**:
- `lib/actions.ts`(6 个 server actions: addTask/closeTask/addWish/addChild/submitTask/redeemWish)
- `components/child/confetti.tsx` + `confetti.module.css`
- 5 个 `app/admin/*/*-client.tsx`(tasks/wishes/children/records/settings)
- 5 个 `app/admin/*/page.tsx` 薄 server wrapper
- `app/admin/admin.module.css` 扩展(~600 → ~1600 行)
- `lib/mock-data.ts` 加 6 mutation 函数

### 第六轮(Toast 通知,2 新建 + 8 修改)

**修改(8 个)**:
- `app/layout.tsx`(+`<ToastProvider>`)
- 5 个 admin `*-client.tsx` + 2 child 组件(`task-card.tsx`, `wish-card.tsx`)各加 `useToast()` 调用

**新建(2 个)**:
- `components/common/toast.tsx`(Provider + hook + 3 变体)
- `components/common/toast.module.css`

**14 个 toast 调用点**: 5 admin 模态(新增任务/关闭任务/添加愿望/添加孩子/复制地址) + 2 admin settings(改密/密保/清空) + child 任务提交 + child 愿望兑换(成功/失败各 1)

### 第七轮(Admin /tasks 编辑,1 重写 + 2 修改 + 0 新建)

**修改(3 个)**:
- `lib/mock-data.ts`(+`updateTask(taskId, patch)`)
- `lib/actions.ts`(+`updateTaskAction(formData)`)
- `app/admin/admin.module.css`(+`.iconBtn` 32×32 通用图标按钮)
- `app/admin/tasks/tasks-client.tsx`(**重写**:加 `editingTask` state,`formKey` 强制 remount 预填,Modal 复用 add+edit,`Pencil` 图标按钮)

**新建(0)**: 复用 Modal + useToast + Tabs 全部组件

### 第八轮(Admin /wishes 编辑,1 重写 + 2 修改 + 0 新建)

**修改(3 个)**:
- `lib/mock-data.ts`(+`updateWish(wishId, patch)`)
- `lib/actions.ts`(+`updateWishAction(formData)`)
- `app/admin/wishes/wishes-client.tsx`(**重写**:加 `editingWish` state,`formKey` 强制 remount 预填,Modal 复用 add+edit,owner select 解析 isFamily)

**新建(0)**: 复用 Modal + useToast + Tabs 全部组件

### 第九轮(Admin /children 编辑,1 重写 + 3 修改 + 0 新建)

**修改(4 个)**:
- `components/common/color-picker.tsx`(**控控化**:`+ value?: string` + `+ onChange?: (key, color) => void`,向后兼容)
- `lib/mock-data.ts`(+`updateChild(childId, patch)`;改 name 时同步重生成 slug)
- `lib/actions.ts`(+`updateChildAction(formData)`;revalidate 双路由)
- `app/admin/children/children-client.tsx`(**重写**:加 `editingChild` state + `themeKey` state,ColorPicker 控控化,Modal 复用 add+edit,**修复原 bug**:themeColor 硬编码第一 preset 改为从 `themeKey` 派生)

**新建(0)**: 复用 Modal + useToast + ColorPicker(已升级)全部组件

### 第十轮(Landing 登录/注册弹窗,4 新建 + 6 修改 + 4 删除)

**修改(6 个)**:
- `app/page.tsx`(**重写**):server 组件用 Suspense 包 `LandingHeader`,内部 `createClient().auth.getUser()` 决定登录态
- `components/landing/navbar.tsx`(**重写**):server 组件读 Supabase auth,品牌 + `UserArea`
- `components/landing/hero.tsx`(**重写**):client,已登录显示「进入管理后台」直链 `/admin`,未登录按钮调 `openAuthModal('signup')`
- `app/landing.module.css`(+`.signupBtn` 描边次按钮 + `.userName` max-width 200 + ellipsis 防止长邮箱溢出)
- `lib/supabase/proxy.ts`(**回退**):删掉 §8.1 第九轮临时改造,恢复 Supabase `getClaims()` 守卫
- `components/admin/sidebar.tsx`(**回退**):删 `logoutAction` 改用,恢复 `createClient().auth.signOut() + router.push('/')`
- `.env.example`(**回退**):删 `SESSION_SECRET`

**新建(4 个)**:
- `components/landing/auth-modal.tsx`(`AuthModal` 客户端组件,登录/注册 tab 切换,调 `supabase.auth.signInWithPassword` / `signUp`,错误 / 成功 / 邮箱确认提示)
- `components/landing/auth-modal.module.css`(modal 样式,匹配 cafe 主题:overlay blur / pop 动画 / 圆角 16 / 表单输入 36×42 / submit 棕主色)
- `components/landing/user-area.tsx`(`UserArea` 客户端:登录/注册按钮 + 登录态用户名 + 退出按钮;导出 `openAuthModal(tab)` 供 hero 跨组件触发同一 modal;`useEffect` 监听 `rewards-daily:open-auth` custom event)

**删除(4 个,第九轮临时实装的 4 位密码相关)**:
- `lib/session.ts`(`encodeSession` / `decodeSession` HMAC-SHA256)
- `lib/auth-actions.ts`(`loginAction` / `logoutAction` / `getCurrentAdminName`)
- `components/landing/login-modal.tsx`(4 位密码弹窗)
- `components/landing/login-modal.module.css`

**Supabase 迁移(2 步)**:
- 第九轮:加 `settings.admin_name` 字段 + `settings_anon_read` RLS policy
- 第十轮:`ALTER TABLE settings DROP COLUMN admin_name` + `DROP POLICY settings_anon_read`(`settings` 表回到 §5.3 原状,`admin_pwd` 仍在)

**验证**:`tsc --noEmit` 0 / `eslint .` 0 / `next build` 0(`/route 标 ◐ Partial Prerender,Navbar+Hero 走 Suspense 流式)



## 8.7 第二轮实施偏差(临时)

### 8.7.1 AdminShell 数据接入(临时)

**PRD §3.1 目标态**: 控制台首页展示真实数据 — 今日待审核任务数、孩子总积分、今日已完成任务、待达成愿望数,数据来自 Supabase `task_audit` / `wishes` / `points_records` / `children` 4 张表。

**本轮实施**: 全部 4 个统计数字 + 3 条待审核任务 + 2 个孩子选项均来自 `lib/mock-data.ts` 静态常量。`/admin` 页面零 Supabase 调用,无 RLS 约束。

**回归路径**: Supabase 6 张表落地后,把 `lib/mock-data.ts` 改为 `lib/queries.ts`(用 `createClient` + RLS 安全的查询),`StatsGrid` / `ReviewList` / `PointAdjustmentModals` 内部从 props 接数据。

### 8.7.2 5 个 Admin 子路由(临时 404)

**PRD §3.2-§3.6 / §7 目标态**: `/admin/tasks` `/admin/wishes` `/admin/children` `/admin/records` `/admin/settings` 5 个子页全部实装。

**本轮实施**: 5 个子路由 404。Sidebar 6 个菜单项全部 live,点击未实现的 5 个跳 Next.js 默认 404 页。

**回归路径**: 按 PRD §3.2-§3.6 顺序逐个实装,sidebar 无需改动。

### 8.7.3 Sidebar 退出登录自实现(临时)

**目标态**: 后续抽 `LogoutButton` 通用组件,支持 `variant` prop 适配不同上下文(全宽 nav-link 样式 / 紧凑 toolbar 样式)。

**本轮实施**: Sidebar 直接 inline 实现退出登录(用 `createClient` + `useRouter`),不复用 starter 的 `LogoutButton`(因为后者是英文 "Logout" + shadcn Button 样式,与设计不符)。`components/logout-button.tsx` 文件未动,`components/auth-button.tsx`(starter 样例)继续使用它。

**回归路径**: 抽出 `LogoutButton` 组件支持 `variant="admin-sidebar" | "default"`,删掉 sidebar 内的 inline 实现。

### 8.7.4 FAB / 弹窗 / 通过拒绝无交互(临时)

**PRD §1.3 目标态**: 全部页面交互真实可用 — 通过/拒绝任务、弹窗表单提交加分扣分。

**本轮实施**: 纯视觉(用户选择 Pure visual 模式)。FAB 按钮 + 弹窗表单 + 通过拒绝按钮均无 onClick/onSubmit,弹窗默认 `hidden` 永远不显示。

**回归路径**: 下一轮加 `useState` toggle 弹窗 + onClick 触发 toast / 更新列表 + Supabase mutation。引入通用 `Modal` 组件时,本轮的 `point-adjustment-modal.tsx` 拆为 `<Modal>` + `<PointAdjustmentForm>` 两层。

### 8.7.5 /child 路由策略仍未决定

~~见 §8.3,本轮「进入孩子模式」按钮指向 `/child/1` → 404。决策仍待第三轮。~~

**第四轮已决**: B(childId 公开)。详见 §8.3。

## 8.8 第十轮决策(2026-06-02)

### 8.8.1 Auth 方案显式选择:沿用 Supabase Auth,暂缓 4 位密码

**背景**: 第九轮按 PRD §8.1 目标态实装 4 位密码登录(4 位 pin 弹窗 + HMAC cookie + 改 proxy 守卫 + 落 `settings.admin_pwd` seed + 加 `admin_name` 列 + 加 anon RLS)。代码全过 tsc/lint/build,功能可用。

**用户反馈**: "你不用这里的注册和登录逻辑吗?可以的话,在 landing 增加一个注册的逻辑,复用原来 supabase 这套逻辑。" 显式要求:
1. 退回 Supabase email/password auth
2. 在 landing 增加注册入口(原 starter 注册流程藏在 `/auth/sign-up` 单独页,friction 太大)

**本轮决定**:
- 第十轮整批回退第九轮 4 位密码实装(4 文件删除 + 1 列 drop + 1 policy drop + proxy 恢复)
- 新增 `AuthModal` + `UserArea`,Landing 装配登录/注册合并弹窗,登录/注册成功后跳 `/admin`
- 4 位密码**仍是 V1.0 目标态**,但优先级下调到 Supabase 数据接入 + 真实业务闭环之后
- V1.0 切换 4 位密码的具体步骤见 §8.1 回归路径(4 步)

**未选**:
- (A) 强制 4 位密码:违背用户当前选择,UI 设计稿 `design/index.html` 中"忘记密码 → 密保问题"二级展开也需要再细化
- (B) 4 位密码 + Supabase auth 并行入口:复杂度 +1,proxy 要支持两种 session,投资回报低
- (C) 4 位密码替换 Supabase auth 但不内嵌 modal:与本轮 landing modal 实装方向相反,改动面更大

### 8.8.2 Landing modal 跨组件触发:custom event 而非 Context

**问题**: `UserArea`(navbar 内)挂载 `AuthModal`,但 hero 的「开始使用」按钮也在同一页要触发同一 modal。两者是不同子树,共享状态需要 Context 或 zustand。

**选择**: 用 `window.dispatchEvent(new CustomEvent('rewards-daily:open-auth', { detail: { tab } }))` + `UserArea` 内 `useEffect` 监听。
- **优点**:零依赖、不引入 Context Provider、不增加 root layout 嵌套
- **缺点**:global window 事件,理论上可被其他脚本覆盖;但事件名带项目前缀,风险可控
- **未来**:modal 数量增加到 3+ 个(密保问答 / 重置密码)时再抽 `ModalProvider` context,本轮不值得

### 8.8.3 Modal 写中文 UI 而非复用 shadcn LoginForm

**问题**: starter 的 `LoginForm` / `SignUpForm` 用 shadcn `Card` + `Input` + `Button`,英文文案(`"Login"` / `"Don't have an account?"`),塞进 cafe 主题的 landing modal 视觉割裂。

**选择**: 写 `AuthModal` 自带中文表单(复用 `createClient` API 即可),modal 内部 div 布局而非 Card 卡片。
- 保留 `components/login-form.tsx` / `sign-up-form.tsx` 不动(`/auth/login` 等独立页仍可用,作为 fallback)
- `AuthModal` 体积 ~210 行(表单 + 状态机 + 错误展示),可控
- 中文文案 / 圆角 / 间距对齐 landing design

**未选**: 把 `LoginForm` / `SignUpForm` 重写为 i18n 通用版,改动面太大且本轮范围只是 landing。


