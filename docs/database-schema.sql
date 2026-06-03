-- ============================================================
-- Rewards Daily (成长星球) — Supabase 数据库 Schema
-- ============================================================
-- 适用版本: V1.0 (PRD §5)
-- 适用对象: Supabase Postgres (>= 15)
-- 当前状态: 生产数据库已按此 schema 建立
-- ============================================================

-- ============================================================
-- 1. 公共工具
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. 7 张核心表（均含 owner_id FK → auth.users）
-- ============================================================

-- 2.1 settings — 全局配置（每owner一行）
CREATE TABLE IF NOT EXISTS public.settings (
  owner_id                  uuid         PRIMARY KEY REFERENCES auth.users(id),
  admin_pwd                 varchar(4)   NOT NULL DEFAULT '',
  global_theme              varchar(20)  NOT NULL DEFAULT 'cafe',
  sound_open                boolean      NOT NULL DEFAULT true,
  compact_mode              boolean      NOT NULL DEFAULT false,
  child_access_pwd_enabled  boolean      NOT NULL DEFAULT false,
  created_at                timestamptz  NOT NULL DEFAULT now(),
  updated_at                timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2 children — 孩子
CREATE TABLE IF NOT EXISTS public.children (
  id            bigserial    PRIMARY KEY,
  name          varchar(50)  NOT NULL,
  slug          varchar(50)  NOT NULL UNIQUE,
  avatar_url    text         NULL,
  avatar_style  text         NOT NULL DEFAULT 'smile' CHECK (avatar_style IN ('smile', 'smile-plus')),
  theme_key     varchar(20)  NOT NULL DEFAULT 'sky',
  theme_color   varchar(20)  NOT NULL,
  total_points  int          NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  level         int          NOT NULL DEFAULT 1 CHECK (level >= 1),
  share_token   uuid         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  owner_id      uuid         NOT NULL REFERENCES auth.users(id)
);

CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_children_owner   ON public.children(owner_id);
CREATE INDEX IF NOT EXISTS idx_children_share   ON public.children(share_token);

-- 2.3 tasks — 任务配置
CREATE TABLE IF NOT EXISTS public.tasks (
  id            bigserial    PRIMARY KEY,
  name          varchar(100) NOT NULL,
  icon          varchar(20)  NOT NULL,
  points        int          NOT NULL CHECK (points > 0),
  cycle         varchar(20)  NOT NULL CHECK (cycle IN ('daily', 'weekly', 'once')),
  auto_check    boolean      NOT NULL DEFAULT true,
  status        boolean      NOT NULL DEFAULT true,
  closed_reason text         NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  owner_id      uuid         NOT NULL REFERENCES auth.users(id)
);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tasks_owner ON public.tasks(owner_id);

-- 2.4 task_assignments — 任务-孩子多对多
CREATE TABLE IF NOT EXISTS public.task_assignments (
  task_id    bigint       NOT NULL REFERENCES public.tasks(id)    ON DELETE CASCADE,
  child_id   bigint       NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_at timestamptz  NOT NULL DEFAULT now(),
  owner_id   uuid         NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (task_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_child ON public.task_assignments(child_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_owner ON public.task_assignments(owner_id);

-- 2.5 task_audit — 任务审核流水
CREATE TABLE IF NOT EXISTS public.task_audit (
  id            bigserial    PRIMARY KEY,
  task_id       bigint       NOT NULL REFERENCES public.tasks(id)    ON DELETE CASCADE,
  child_id      bigint       NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  submit_time   timestamptz  NOT NULL DEFAULT now(),
  audit_time    timestamptz  NULL,
  audit_status  varchar(20)  NOT NULL DEFAULT 'pending' CHECK (audit_status IN ('pending', 'agree', 'refuse')),
  refuse_reason text         NULL,
  owner_id      uuid         NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_task_audit_status  ON public.task_audit(audit_status);
CREATE INDEX IF NOT EXISTS idx_task_audit_child   ON public.task_audit(child_id, submit_time DESC);
CREATE INDEX IF NOT EXISTS idx_task_audit_owner   ON public.task_audit(owner_id);

-- 2.6 wishes — 愿望
CREATE TABLE IF NOT EXISTS public.wishes (
  id            bigserial    PRIMARY KEY,
  name          varchar(100) NOT NULL,
  image_url     text         NULL,
  emoji         varchar(20)  NULL,
  target_points int          NOT NULL CHECK (target_points > 0),
  child_id      bigint       NULL REFERENCES public.children(id) ON DELETE CASCADE,
  is_family     boolean      NOT NULL DEFAULT false,
  is_lock       boolean      NOT NULL DEFAULT false,
  is_target     boolean      NOT NULL DEFAULT false,
  is_finish     boolean      NOT NULL DEFAULT false,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  owner_id      uuid         NOT NULL REFERENCES auth.users(id)
);

CREATE TRIGGER trg_wishes_updated_at
  BEFORE UPDATE ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_wishes_owner ON public.wishes(owner_id);

-- 2.7 points_records — 积分流水
CREATE TABLE IF NOT EXISTS public.points_records (
  id           bigserial    PRIMARY KEY,
  child_id     bigint       NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  related_id   bigint       NULL,
  record_type  varchar(20)  NOT NULL CHECK (record_type IN ('earn', 'deduct', 'manual', 'wish', 'task')),
  points       int          NOT NULL,
  remark       text         NULL,
  create_time  timestamptz  NOT NULL DEFAULT now(),
  owner_id     uuid         NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_points_records_child_time ON public.points_records(child_id, create_time DESC);
CREATE INDEX IF NOT EXISTS idx_points_records_owner      ON public.points_records(owner_id);

-- ============================================================
-- 3. DB Functions (RPC, SECURITY DEFINER 绕过 RLS)
-- ============================================================

-- 3.1 approve_task — 通过审核（单事务：更新状态 + 加积分 + 写流水）
CREATE OR REPLACE FUNCTION public.approve_task(p_audit_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task_id bigint;
  v_child_id bigint;
  v_points int;
  v_owner_id uuid;
BEGIN
  SELECT task_id, child_id, owner_id INTO v_task_id, v_child_id, v_owner_id
  FROM public.task_audit WHERE id = p_audit_id AND audit_status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  SELECT points INTO v_points FROM public.tasks WHERE id = v_task_id;

  UPDATE public.task_audit SET audit_status = 'agree', audit_time = now()
  WHERE id = p_audit_id;

  UPDATE public.children SET total_points = total_points + v_points
  WHERE id = v_child_id;

  INSERT INTO public.points_records (child_id, record_type, points, remark, owner_id)
  VALUES (v_child_id, 'task', v_points, '任务完成 · 自动审核', v_owner_id);

  RETURN jsonb_build_object('ok', true, 'points', v_points);
END;
$$;

-- 3.2 redeem_wish — 兑换愿望
CREATE OR REPLACE FUNCTION public.redeem_wish(p_share_token text, p_wish_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_child_id bigint;
  v_owner_id uuid;
  v_cost int;
  v_current int;
BEGIN
  SELECT id, owner_id INTO v_child_id, v_owner_id
  FROM public.children WHERE share_token = p_share_token::uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  SELECT target_points INTO v_cost FROM public.wishes WHERE id = p_wish_id AND is_finish = false;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  SELECT total_points INTO v_current FROM public.children WHERE id = v_child_id;
  IF v_current < v_cost THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  UPDATE public.children SET total_points = total_points - v_cost WHERE id = v_child_id;
  UPDATE public.wishes SET is_finish = true WHERE id = p_wish_id;

  INSERT INTO public.points_records (child_id, record_type, points, remark, related_id, owner_id)
  VALUES (v_child_id, 'wish', -v_cost, '兑换:' || (SELECT name FROM public.wishes WHERE id = p_wish_id), p_wish_id, v_owner_id);

  RETURN jsonb_build_object('ok', true, 'remaining', v_current - v_cost);
END;
$$;

-- 3.3 adjust_points — 手动调整积分
CREATE OR REPLACE FUNCTION public.adjust_points(p_child_id bigint, p_delta int, p_reason text, p_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_current int;
BEGIN
  SELECT owner_id, total_points INTO v_owner_id, v_current
  FROM public.children WHERE id = p_child_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF p_type = 'deduct' AND v_current < p_delta THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  UPDATE public.children
  SET total_points = total_points + CASE WHEN p_type = 'deduct' THEN -p_delta ELSE p_delta END
  WHERE id = p_child_id;

  INSERT INTO public.points_records (child_id, record_type, points, remark, owner_id)
  VALUES (p_child_id, p_type, CASE WHEN p_type = 'deduct' THEN -p_delta ELSE p_delta END, p_reason, v_owner_id);

  RETURN jsonb_build_object('ok', true, 'new_total', v_current + CASE WHEN p_type = 'deduct' THEN -p_delta ELSE p_delta END);
END;
$$;

-- 3.4 verify_child_password — 校验管理密码（供 child 页面密码门使用）
CREATE OR REPLACE FUNCTION public.verify_child_password(p_owner_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.settings
    WHERE owner_id = p_owner_id AND admin_pwd = p_password
  );
END;
$$;

-- 3.5 check_child_access_enabled — 检查孩子页面密码保护是否开启
CREATE OR REPLACE FUNCTION public.check_child_access_enabled(p_child_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.children WHERE id = p_child_id;
  RETURN EXISTS (
    SELECT 1 FROM public.settings
    WHERE owner_id = v_owner_id AND child_access_pwd_enabled = true
  );
END;
$$;

-- ============================================================
-- 4. RLS 行级安全
-- ============================================================

ALTER TABLE public.settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records   ENABLE ROW LEVEL SECURITY;

-- settings: 仅 authenticated owner
CREATE POLICY settings_owner_all ON public.settings
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- children: owner 全权; anon 可通过 share_token 读
CREATE POLICY children_owner_all ON public.children
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY children_anon_share_read ON public.children
  FOR SELECT TO anon USING (share_token IS NOT NULL);

-- tasks / task_assignments / task_audit / wishes / points_records: authenticated owner 全权
CREATE POLICY tasks_owner_all ON public.tasks
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY assignments_owner_all ON public.task_assignments
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY audit_owner_all ON public.task_audit
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY wishes_owner_all ON public.wishes
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY records_owner_all ON public.points_records
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- 5. Storage 桶
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar', 'avatar', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatar_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatar');
CREATE POLICY "avatar_authenticated_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatar');
