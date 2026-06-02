-- ============================================================
-- 家庭成长激励助手 — Supabase 数据库 Schema
-- ============================================================
-- 适用版本: V1.0 (PRD §5)
-- 适用对象: Supabase Postgres (>= 15)
-- 执行方式: Supabase Dashboard → SQL Editor → 粘贴执行
-- 重置方式: 末尾含 DROP 块(谨慎)
-- ============================================================

-- ============================================================
-- 1. 公共工具: updated_at 自动触发器
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. 6 张核心表
-- ============================================================

-- 2.1 settings — 全局配置(单行,id 恒为 1)
CREATE TABLE IF NOT EXISTS public.settings (
  id                int          PRIMARY KEY DEFAULT 1,
  admin_pwd         varchar(4)   NOT NULL,
  security_question text         NULL,
  security_answer   text         NULL,
  global_theme      varchar(20)  NOT NULL DEFAULT 'cafe',
  sound_open        boolean      NOT NULL DEFAULT true,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2 children — 孩子
CREATE TABLE IF NOT EXISTS public.children (
  id           bigserial    PRIMARY KEY,
  name         varchar(50)  NOT NULL,
  slug         varchar(50)  NOT NULL UNIQUE,
  avatar_url   text         NULL,
  theme_key    varchar(20)  NOT NULL DEFAULT 'sky',  -- sky/coral/mint/lavender/sun
  theme_color  varchar(20)  NOT NULL,
  total_points int          NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  level        int          NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.3 tasks — 任务配置
CREATE TABLE IF NOT EXISTS public.tasks (
  id         bigserial    PRIMARY KEY,
  name       varchar(100) NOT NULL,
  icon       varchar(20)  NOT NULL,
  points     int          NOT NULL CHECK (points > 0),
  type       varchar(20)  NULL,        -- life/study/housework/character
  cycle      varchar(20)  NOT NULL,    -- daily/weekly/once
  auto_check boolean      NOT NULL DEFAULT true,
  status     boolean      NOT NULL DEFAULT true,  -- true=active, false=closed
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.4 task_assignments — 任务-孩子多对多(PRD §5.3 未明确,补充表)
CREATE TABLE IF NOT EXISTS public.task_assignments (
  task_id    bigint       NOT NULL REFERENCES public.tasks(id)    ON DELETE CASCADE,
  child_id   bigint       NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_at timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_child ON public.task_assignments(child_id);

-- 2.5 task_audit — 任务审核流水
CREATE TABLE IF NOT EXISTS public.task_audit (
  id            bigserial    PRIMARY KEY,
  task_id       bigint       NOT NULL REFERENCES public.tasks(id)    ON DELETE CASCADE,
  child_id      bigint       NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  submit_time   timestamptz  NOT NULL DEFAULT now(),
  audit_time    timestamptz  NULL,
  audit_status  varchar(20)  NOT NULL DEFAULT 'pending',  -- pending/agree/refuse
  refuse_reason text         NULL
);

CREATE INDEX IF NOT EXISTS idx_task_audit_status  ON public.task_audit(audit_status);
CREATE INDEX IF NOT EXISTS idx_task_audit_child   ON public.task_audit(child_id, submit_time DESC);
CREATE INDEX IF NOT EXISTS idx_task_audit_task    ON public.task_audit(task_id);

-- 2.6 wishes — 愿望
CREATE TABLE IF NOT EXISTS public.wishes (
  id            bigserial    PRIMARY KEY,
  name          varchar(100) NOT NULL,
  image_url     text         NULL,   -- supabase storage public URL
  emoji         varchar(20)  NULL,   -- fallback when no image
  target_points int          NOT NULL CHECK (target_points > 0),
  child_id      bigint       NULL REFERENCES public.children(id) ON DELETE CASCADE,  -- NULL=家庭
  is_family     boolean      NOT NULL DEFAULT false,
  is_lock       boolean      NOT NULL DEFAULT false,
  is_target     boolean      NOT NULL DEFAULT false,
  is_finish     boolean      NOT NULL DEFAULT false,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_wishes_updated_at
  BEFORE UPDATE ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_wishes_child   ON public.wishes(child_id);
CREATE INDEX IF NOT EXISTS idx_wishes_family  ON public.wishes(is_family) WHERE is_family = true;

-- 2.7 points_records — 积分流水
CREATE TABLE IF NOT EXISTS public.points_records (
  id           bigserial    PRIMARY KEY,
  child_id     bigint       NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  related_id   bigint       NULL,   -- task_audit.id or wish.id
  record_type  varchar(20)  NOT NULL,  -- earn / deduct / manual / wish
  points       int          NOT NULL,  -- 正数=获得,负数=扣除
  remark       text         NULL,
  create_time  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_records_child_time ON public.points_records(child_id, create_time DESC);
CREATE INDEX IF NOT EXISTS idx_points_records_type        ON public.points_records(record_type);
CREATE INDEX IF NOT EXISTS idx_points_records_create_time ON public.points_records(create_time DESC);

-- ============================================================
-- 3. 视图(方便前端聚合查询)
-- ============================================================

-- 3.1 wish_progress — 愿望当前进度(由 points_records 聚合)
CREATE OR REPLACE VIEW public.v_wish_progress AS
SELECT
  w.id            AS wish_id,
  w.name,
  w.target_points,
  w.child_id,
  w.is_family,
  w.is_lock,
  w.is_target,
  w.is_finish,
  COALESCE(SUM(CASE WHEN pr.record_type = 'earn' THEN pr.points
                    WHEN pr.record_type = 'wish' THEN -pr.points
                    ELSE 0 END), 0)::int AS current_points
FROM public.wishes w
LEFT JOIN public.points_records pr
  ON pr.related_id = w.id
 AND pr.record_type IN ('earn', 'wish')
GROUP BY w.id;

-- 3.2 child_summary — 孩子聚合统计(供 dashboard)
CREATE OR REPLACE VIEW public.v_child_summary AS
SELECT
  c.id                AS child_id,
  c.name,
  c.slug,
  c.total_points,
  c.level,
  c.theme_color,
  COUNT(DISTINCT ta.task_id)        AS active_task_count,
  COUNT(DISTINCT CASE WHEN ta.audit_status = 'pending' THEN ta.id END) AS pending_audit_count,
  COUNT(DISTINCT CASE WHEN ta.audit_status = 'agree'   THEN ta.id END) AS completed_today_count
FROM public.children c
LEFT JOIN public.task_audit ta
  ON ta.child_id = c.id
 AND ta.submit_time::date = CURRENT_DATE
GROUP BY c.id;

-- 3.3 dashboard_stats — 顶部 4 数字
CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.task_audit WHERE audit_status = 'pending')                AS pending_review,
  (SELECT COALESCE(SUM(total_points), 0) FROM public.children)                           AS total_points,
  (SELECT COUNT(*) FROM public.task_audit WHERE audit_status = 'agree' AND audit_time::date = CURRENT_DATE) AS completed_today,
  (SELECT COUNT(*) FROM public.wishes WHERE is_finish = false AND is_lock = false)      AS pending_wishes;

-- ============================================================
-- 4. RLS 行级安全(预留给 Supabase 接入)
-- ============================================================
-- 当前 mock-data 阶段不连 Postgres,RLS 不会被触发;
-- 这些策略为真正接入 Supabase 时直接可用。
-- 设计原则:
--   1) server actions 内部用 service_role key(绕过 RLS)。
--   2) RLS 主要保护"如果未来有 anon 直连场景"以及防御意外暴露。
--   3) anon 角色:孩子端公开读;authenticated 角色:管理员端。
--   4) 4 位密码 + cookie session 在 server action 内部校验,不依赖 RLS。
-- ============================================================

ALTER TABLE public.settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records   ENABLE ROW LEVEL SECURITY;

-- settings: 仅管理员(实际由 service_role 走,RLS 作 defense-in-depth)
CREATE POLICY settings_all ON public.settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- children: 任何角色可读(孩子端要看自己/家庭愿望头像),写由 service_role 走
CREATE POLICY children_read ON public.children
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY children_write ON public.children
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tasks: 同上
CREATE POLICY tasks_read ON public.tasks
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY tasks_write ON public.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_assignments: 同上
CREATE POLICY assignments_read ON public.task_assignments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY assignments_write ON public.task_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- task_audit: 任何角色可读(孩子端按 child_id 过滤),孩子可创建,管理员可改
CREATE POLICY audit_read ON public.task_audit
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY audit_create ON public.task_audit
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY audit_update ON public.task_audit
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- wishes: 任何角色可读,管理员可写
CREATE POLICY wishes_read ON public.wishes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY wishes_write ON public.wishes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- points_records: 任何角色可读,管理员可写
CREATE POLICY records_read ON public.points_records
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY records_write ON public.points_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 5. 种子数据(可选,开发环境)
-- ============================================================

INSERT INTO public.settings (id, admin_pwd, security_question, security_answer, global_theme, sound_open)
VALUES (1, '1234', '您母亲的姓名是?', '示例答案', 'cafe', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.children (name, slug, theme_key, theme_color, total_points, level)
VALUES
  ('小明', 'xiaoming', 'sky',      '#7DD3FC', 860, 5),
  ('小红', 'xiaohong', 'coral',    '#FCA5A5', 420, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tasks (name, icon, points, type, cycle, auto_check, status)
VALUES
  ('刷牙打卡',   '💧', 5,  'life',      'daily',  true, true),
  ('亲子阅读',   '📚', 10, 'study',     'daily',  true, true),
  ('户外运动',   '🎳', 15, 'life',      'daily',  true, true),
  ('整理玩具',   '🧹', 5,  'housework', 'daily',  true, true),
  ('帮忙做家务', '💌', 10, 'housework', 'weekly', true, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.task_assignments (task_id, child_id)
SELECT t.id, c.id FROM public.tasks t, public.children c
WHERE t.name IN ('刷牙打卡','亲子阅读','户外运动','整理玩具','帮忙做家务')
  AND c.name IN ('小明','小红')
ON CONFLICT DO NOTHING;

INSERT INTO public.wishes (name, emoji, target_points, child_id, is_family, is_target)
VALUES
  ('画笔套装',     '🎨',  50,  (SELECT id FROM public.children WHERE slug='xiaoming'), false, true),
  ('恐龙模型',     '🚀',  80,  (SELECT id FROM public.children WHERE slug='xiaoming'), false, false),
  ('小吉他',       '🎲',  100, (SELECT id FROM public.children WHERE slug='xiaohong'), false, true),
  ('游乐园一日游', '🌈',  200, NULL,                                              true,  true),
  ('全家聚餐',     '🍰',  150, NULL,                                              true,  false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. Storage 桶(在 Supabase Dashboard 手动创建,或用 SQL)
-- ============================================================
-- 桶名: avatar (PRD §5.2 唯一桶)
-- 用途: 孩子头像、愿望配图
-- 公共读,登录写
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar', 'avatar', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatar_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatar');

CREATE POLICY "avatar_authenticated_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatar');

CREATE POLICY "avatar_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatar')
  WITH CHECK (bucket_id = 'avatar');

CREATE POLICY "avatar_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatar');

-- ============================================================
-- 7. 重置脚本(注释掉,需要时手动启用)
-- ============================================================

-- DROP TABLE IF EXISTS public.points_records   CASCADE;
-- DROP TABLE IF EXISTS public.task_audit       CASCADE;
-- DROP TABLE IF EXISTS public.task_assignments CASCADE;
-- DROP TABLE IF EXISTS public.wishes           CASCADE;
-- DROP TABLE IF EXISTS public.tasks            CASCADE;
-- DROP TABLE IF EXISTS public.children         CASCADE;
-- DROP TABLE IF EXISTS public.settings         CASCADE;
-- DROP FUNCTION IF EXISTS public.set_updated_at();
