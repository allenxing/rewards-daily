"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-modal.module.css";

type Tab = "login" | "signup";

type Props = {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
};

export function AuthModal({ open, onClose, initialTab = "login" }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTab(initialTab);
      setEmail("");
      setPassword("");
      setConfirm("");
      setError(null);
      setInfo(null);
      setLoading(false);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setInfo(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      onClose();
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录失败,请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (err) throw err;
      if (data.session) {
        onClose();
        router.push("/admin");
        router.refresh();
        return;
      }
      setInfo("注册成功!请前往邮箱完成确认,然后登录。");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败,请重试");
    } finally {
      setLoading(false);
    }
  };

  const goForgot = () => {
    onClose();
    router.push("/auth/forgot-password");
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={tab === "login" ? "管理员登录" : "注册账号"}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          aria-label="关闭"
          onClick={onClose}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Lock size={20} strokeWidth={2.5} />
          </div>
          <h2 className={styles.title}>
            {tab === "login" ? "管理员登录" : "创建账号"}
          </h2>
          <p className={styles.sub}>
            {tab === "login"
              ? "登录以进入管理后台"
              : "注册一个家长账号,开始使用"}
          </p>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            onClick={() => switchTab("login")}
            className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
          >
            登录
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signup"}
            onClick={() => switchTab("signup")}
            className={`${styles.tab} ${tab === "signup" ? styles.tabActive : ""}`}
          >
            注册
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>邮箱</span>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </label>
            <label className={styles.field}>
              <div className={styles.labelRow}>
                <span className={styles.label}>密码</span>
                <button
                  type="button"
                  onClick={goForgot}
                  className={styles.forgot}
                >
                  忘记密码?
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </label>
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className={styles.submit}
              disabled={loading || !email || !password}
            >
              {loading ? "登录中…" : "登 录"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>邮箱</span>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>密码(至少 6 位)</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>确认密码</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={styles.input}
              />
            </label>
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}
            {info && (
              <div className={styles.info} role="status">
                {info}
              </div>
            )}
            <button
              type="submit"
              className={styles.submit}
              disabled={loading || !email || !password || !confirm}
            >
              {loading ? "注册中…" : "注 册"}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          {tab === "login" ? (
            <>
              还没有账号?
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className={styles.linkBtn}
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号?
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={styles.linkBtn}
              >
                去登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
