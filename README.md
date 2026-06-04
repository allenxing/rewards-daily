# Rewards Daily (成长星球)

**Rewards Daily** — 一款家庭习惯激励 Web 应用，采用家长管理端 + 孩子使用端双模式架构，通过「任务 → 积分 → 愿望奖励」闭环体系，帮助家长培养孩子良好习惯。

## 技术栈

- **框架**: [Next.js 16](https://nextjs.org) (App Router, RSC, cacheComponents)
- **样式**: [Tailwind CSS 3](https://tailwindcss.com) + `tailwindcss-animate`
- **组件库**: [shadcn/ui](https://ui.shadcn.com) (new-york 风格, neutral 基色)
- **图标**: [lucide-react](https://lucide.dev)
- **数据库**: [Supabase](https://supabase.com) PostgreSQL (云端 + RLS 权限)
- **认证**: Supabase Auth (邮箱密码)
- **国际化**: [next-intl](https://next-intl.dev) (中/英双语, cookie 切换)
- **状态管理**: [zustand](https://github.com/pmndrs/zustand)
- **主题**: [next-themes](https://github.com/pacocoursey/next-themes) (暗色模式)
- **部署**: Vercel + Supabase 云端数据服务

## 功能概览

### 家长管理端 (`/admin/*`)

| 页面 | 路由 | 功能 |
|------|------|------|
| 控制台首页 | `/admin` | 统计数据、待审核任务、FAB 快捷操作 |
| 任务管理 | `/admin/tasks` | 任务 CRUD、周期/指派、关闭/恢复 |
| 愿望管理 | `/admin/wishes` | 愿望 CRUD、个人/家庭归属、锁定 |
| 孩子管理 | `/admin/children` | 孩子卡片管理、专属链接、跳转孩子模式 |
| 积分流水 | `/admin/records` | 筛选/统计/导出积分流水 |
| 系统设置 | `/admin/settings` | 密码、数据备份恢复、个性化、音效 |

### 孩子用户端 (`/child/[shareToken]/*`)

| 页面 | 路由 | 功能 |
|------|------|------|
| 我的首页 | `/child/[shareToken]` | 个人信息、今日任务、愿望进度 |
| 任务大厅 | `/child/[shareToken]/tasks` | 可做/审核中/已完成，一键提交 |
| 梦想宝库 | `/child/[shareToken]/wishes` | 心愿列表、攒星兑换、兑换记录 |

### 公开页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 官网首页 | `/` | Landing Page 纯展示页 |
| 登录 | `/auth/login` | 管理员邮箱密码登录 |

## 快速开始

### 前置要求

- Node.js >= 18
- 一个 [Supabase](https://supabase.com) 项目（获取 URL 和密钥）

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量文件并填写 Supabase 配置
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev
```

环境变量说明（`.env.local`）：

```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目地址
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的Supabase发布密钥
```

> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 兼容 Supabase 新的 publishable key 格式和旧的 anon key 格式。

访问 [http://localhost:3000](http://localhost:3000) 即可查看。

### 数据库

数据库表通过 Supabase 管理后台或迁移脚本创建。核心表：
`settings`, `children`, `tasks`, `task_assignments`, `task_audit`, `wishes`, `points_records`。

DB Functions (RPC)：`approve_task`, `redeem_wish`, `adjust_points`, `verify_child_password`, `check_child_access_enabled`。

### 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (`:3000`) |
| `npm run build` | 生产构建 |
| `npm run start` | 生产启动 |
| `npm run lint` | ESLint 检查 |
| `npx tsc --noEmit` | TypeScript 类型检查 |

## 部署

### Vercel 部署

1. 将代码推送至 GitHub 仓库
2. 在 [Vercel](https://vercel.com) 导入仓库
3. 关联 Supabase 项目（或手动添加环境变量）
4. 部署即可

### Supabase

- 数据库、存储、RLS 策略均在 Supabase 项目内配置
- 前端通过 `lib/supabase/{client,server,proxy}.ts` 三个客户端对接

## 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── page.tsx           # Landing Page
│   ├── layout.tsx         # 根布局 (IntlProvider, ThemeProvider, ToastProvider)
│   ├── admin/             # 家长管理端 (6 个页面)
│   ├── child/             # 孩子用户端 (3 个页面)
│   ├── auth/              # 认证页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── admin/            # 家长端组件 (sidebar, review 等)
│   ├── child/            # 孩子端组件 (header, nav, cards 等)
│   ├── common/           # 通用组件 (modal, toast, tabs, color-picker 等)
│   └── landing/          # Landing Page 组件
├── lib/
│   ├── supabase/         # Supabase 客户端 (client/server/proxy)
│   └── i18n.ts           # next-intl 国际化配置
├── messages/             # i18n 翻译文件 (zh.json, en.json)
├── docs/                 # 产品文档
│   ├── prd.md            # PRD (产品需求文档)
│   └── ...
├── design/               # 静态视觉原型 (HTML, 非 React)
├── proxy.ts              # Next.js 16 middleware (session 刷新)
└── next.config.ts        # Next.js 配置
```

## 国际化

中/英双语，通过 cookie (`NEXT_LOCALE`) 切换。

- 服务端组件：`getTranslations("ns")`
- 客户端组件：`useTranslations("ns")`
- 时区固定：`Asia/Shanghai`

## 权限模型

- **未登录**: 仅公开页面 (`/`, `/child/*`)
- **家长登录**: 全部 `/admin/*`，全量 CRUD
- **孩子访问**: 仅 `/child/[shareToken]`，只读 + 提交任务审核

RLS 行级安全策略确保数据隔离，SECURITY DEFINER RPC 函数绕过 RLS 实现校验逻辑。

## License

MIT
