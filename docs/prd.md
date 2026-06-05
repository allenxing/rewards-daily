# 家庭成长激励助手 Web版 V1.0 最终PRD文档

## 技术栈：Next.js 16 (App Router) + Tailwind CSS + Supabase 云端数据库 + next-intl i18n

# 一、基础信息

## 1.1 项目概述

本项目为响应式Web云端应用，无需自建后端，依托Supabase实现云端数据持久化、多设备同步。采用家长管理端+孩子用户端双模式权限隔离架构，通过「任务-积分-愿望奖励」闭环体系，帮助家长培养孩子良好习惯，数据永久留存、支持备份恢复，轻量化开箱即用。

## 1.2 核心技术方案

- 前端框架：Next.js 16（App Router，服务端/客户端混合渲染）+ cacheComponents
- 样式方案：Tailwind CSS + CSS Modules
- 数据存储：Supabase PostgreSQL云端数据库
- 资源存储：Supabase Storage（avatar桶，已不再用于头像，保留）
- 权限体系：Supabase RLS行级安全策略 + SECURITY DEFINER RPC
- 国际化：next-intl cookie 切换中/英双语
- 部署方式：Vercel前端部署 + Supabase云端数据服务

## 1.3 全局统一交互规范

- Tab唯一用途：仅用于页面内部数据筛选、视图切换，不做页面跳转
- 新增功能：统一页面右上角「新增按钮」，点击唤起弹窗表单
- 编辑功能：列表行内编辑按钮，点击弹窗回显表单编辑
- 删除/状态操作：行内快捷按钮，二次确认后执行
- 所有新增、编辑表单均为弹窗形式，不占用页面路由、不生成Tab

## 1.4 双模式架构与权限

|模式|路由前缀|视觉风格|核心权限|
|---|---|---|---|
|家长管理端|/admin（登录专属，未登录拦截）|简约商务风，白底深蓝主色|全量数据增删改查、任务审核、积分奖惩、数据备份、系统配置|
|孩子用户端|/child/[shareToken]（动态私有路由）|活泼卡通风，高饱和色彩，图形化展示|仅查看个人数据、提交任务审核，无编辑/删除权限|

## 1.5 响应式适配规则

- 桌面端（≥1024px）：家长端固定左右分栏，左侧导航常驻，右侧内容局部刷新
- 平板端（768px-1024px）：隐藏左侧导航，采用双列卡片+顶部滑动Tab布局
- 移动端（<768px）：隐藏左侧导航，单列流式布局，顶部Tab横向可滑动

# 二、全站布局、导航与登录权限规范

## 2.1 官网首页 Landing Page（公开页面）

纯展示落地页，无后台功能。顶部导航（品牌+管理员登录按钮），核心Slogan，功能介绍区（任务养成、积分激励、愿望奖励、勋章荣誉），产品优势区（云端存储、多设备同步、权限隔离），底部版权。

## 2.2 家长Admin后台布局（登录私有页面）

固定左侧常驻导航栏（240px）+ 右侧动态内容区。菜单顺序：控制台首页、任务管理、愿望管理、孩子管理、积分流水记录、系统设置。底部固定退出登录按钮 + 当前登录邮箱。

## 2.3 孩子端页面布局与访问规则

- 访问权限：无公开入口，仅家长后台可跳转/分享专属链接
- 全局布局：全设备统一单列布局，底部常驻Tab：我的首页、任务大厅、梦想宝库
- 可选密码保护：设置页可开启，开启后访问需输入4位admin密码

## 2.4 全站权限流转逻辑

- 未登录：仅可访问首页，拦截/admin，放行/child
- 家长登录：放行全部后台路由，全量管理权限
- 孩子访问：仅个人专属路由可见，只能操作个人数据

# 三、家长Admin后台页面详情

## 3.1 控制台首页（/admin）

统计卡片：今日待审核任务数、孩子总积分、今日已完成任务、待达成愿望数。主体待审核任务列表（通过/拒绝）。悬浮FAB快捷操作（手动加分/扣分）。

## 3.2 任务管理页（/admin/tasks）

二级筛选Tab：【全部任务】【已关闭任务】。新增/编辑弹窗：任务名称、图标选择、积分、执行周期（每天/每周/一次性）、指派孩子、自动审核开关（开启后孩子提交即自动通过，无需家长审核）。关闭弹窗：关闭原因（暂时不需要/已掌握/重复/其他）。恢复启用按钮。

## 3.3 愿望管理页（/admin/wishes）

二级筛选Tab：【全部愿望】【个人愿望】【家庭愿望】。新增/编辑弹窗：愿望配图（emoji）、名称、目标积分、归属（个人/家庭）。行内锁定/删除操作。

## 3.4 孩子管理页（/admin/children）

孩子网格卡片列表（Smile/SmilePlus图标+主题色、昵称、总积分）。新增/编辑弹窗：图标选择（Smile/SmilePlus）、昵称、主题色。每张卡片有「孩子模式」新标签页跳转 + 复制链接。

## 3.5 积分流水记录页（/admin/records）

孩子/类型筛选栏 + 日期范围 + 重置。本月统计（获得/扣除/净增）。每条记录显示：孩子主题色头像+图标+名字、来源、积分变动、时间。导出数据按钮。

## 3.6 系统设置页（/admin/settings）

分组式布局：
- 安全设置：访问密码（4位数字，直接覆盖） + 孩子页面密码保护开关
- 数据管理：导出流水、数据备份、数据恢复、清空所有数据
- 个性化设置：主题色、操作音效、紧凑模式（暂隐藏，待未来实现）
- 关于：版本号、意见反馈、使用帮助（暂隐藏，待未来实现）

# 四、孩子端页面详情

全局底部固定Tab：我的首页、任务大厅、梦想宝库

## 4.1 我的首页（/child/[shareToken]）

顶部个人信息（主题色头像+图标、昵称、积分）、今日任务、愿望进度。

## 4.2 任务大厅（/child/[shareToken]/tasks）

二级Tab：【可做任务】【审核中】【已完成】。任务卡片一键提交，无弹窗无图片上传。

## 4.3 梦想宝库（/child/[shareToken]/wishes）

心愿列表 + 兑换记录。攒够星星即可兑换。

# 五、Supabase云端数据库方案

## 5.1 存储架构

废弃本地存储，采用PostgreSQL数据库 + 对象存储双云端架构，数据永久留存、多设备同步。

## 5.2 核心数据表结构

所有表默认带 `created_at` / `updated_at` + `owner_id`（FK到auth.users）。

### 表1：settings 全局配置表

|字段名|类型|说明|
|---|---|---|
|owner_id|uuid|PK，关联auth.users|
|admin_pwd|varchar(4)|家长登录密码，默认空|
|global_theme|varchar|全局主题色|
|sound_open|boolean|音效开关|
|compact_mode|boolean|紧凑模式|
|child_access_pwd_enabled|boolean|孩子页面密码保护开关|

### 表2：children 孩子信息表

|字段名|类型|说明|
|---|---|---|
|id|bigint|自增主键|
|name|varchar|孩子昵称|
|slug|varchar|唯一标识|
|avatar_style|text|头像风格：smile / smile-plus|
|theme_key|varchar|主题色key|
|theme_color|varchar|主题色hex|
|total_points|int|累计总积分|
|level|int|成长等级|
|share_token|uuid|专属分享链接token|
|avatar_url|text|（不再使用，保留列）|

### 表3：tasks 任务配置表

|字段名|类型|说明|
|---|---|---|
|id|bigint|自增主键|
|name|varchar|任务名称|
|icon|varchar|图标emoji|
|points|int|积分|
|cycle|varchar|执行周期：daily/weekly/once|
|auto_check|boolean|自动审核开关|
|status|boolean|启用/停用|
|closed_reason|text|关闭原因|

### 表4：task_assignments 任务-孩子多对多

|字段名|类型|
|---|---|
|task_id|bigint|
|child_id|bigint|

### 表5：task_audit 任务审核表

|字段名|类型|说明|
|---|---|---|
|id|bigint|自增主键|
|task_id|bigint|关联任务|
|child_id|bigint|关联孩子|
|submit_time|timestamptz|提交时间|
|audit_time|timestamptz|审核时间|
|audit_status|varchar|pending/agree/refuse|
|refuse_reason|text|拒绝原因|

### 表6：wishes 愿望表

|字段名|类型|说明|
|---|---|---|
|id|bigint|自增主键|
|name|varchar|愿望名称|
|emoji|varchar|图标|
|target_points|int|目标积分|
|child_id|bigint|关联孩子，null=家庭|
|is_family|boolean|是否家庭愿望|
|is_lock|boolean|是否锁定|
|is_finish|boolean|是否已完成|

### 表7：points_records 积分流水表

|字段名|类型|说明|
|---|---|---|
|id|bigint|自增主键|
|child_id|bigint|关联孩子|
|record_type|varchar|earn/deduct/manual/wish|
|points|int|积分变动（正/负）|
|remark|text|备注|
|create_time|timestamptz|变动时间|

## 5.3 DB Functions (RPC)

|函数名|说明|
|---|---|
|approve_task(p_audit_id)|通过审核：更新状态 + 加积分 + 写流水|
|redeem_wish(p_share_token, p_wish_id)|兑换愿望：校验积分 + 扣分 + 写流水|
|adjust_points(p_child_id, p_delta, p_reason, p_type)|手动调整积分|
|verify_child_password(p_owner_id, p_password)|校验管理密码（SECURITY DEFINER）|
|check_child_access_enabled(p_child_id)|查孩子页面密码是否开启（SECURITY DEFINER）|

## 5.4 RLS权限管控规则

- settings：authenticated owner ALL
- children：authenticated owner ALL；anon SELECT where share_token IS NOT NULL
- tasks/task_assignments/task_audit/wishes/points_records：authenticated owner ALL
- 存储桶 avatar：public read，authenticated write

## 5.5 前端对接配置

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目地址
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的Supabase发布密钥
```

封装在 `lib/supabase/{client,server,proxy}.ts` 中，分浏览器/RSC/中间件三种客户端。

# 六、全局UI规范

## 6.1 色彩规范

- 家长端主色：咖啡棕系列（#5D4432）
- 孩子端主色：依赖孩子主题色（sky/coral/mint/lavender/sun）
- 成功状态：绿色
- 警告/拒绝：红色
- 中性底色：#f9f7f5

# 七、全站核心路由清单

- `/` — 官网首页
- `/admin` — 控制台首页
- `/admin/tasks` — 任务管理
- `/admin/wishes` — 愿望管理
- `/admin/children` — 孩子管理
- `/admin/records` — 积分流水
- `/admin/settings` — 系统设置
- `/child/[shareToken]` — 孩子首页
- `/child/[shareToken]/tasks` — 任务大厅
- `/child/[shareToken]/wishes` — 梦想宝库
