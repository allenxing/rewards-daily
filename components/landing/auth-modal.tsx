"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("auth");
  const ct = useTranslations("common");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

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
    setEmail("");
    setPassword("");
    setConfirm("");
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
      setError(err instanceof Error ? err.message : t("error.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError(t("error.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("error.passwordTooShort"));
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
      setInfo(t("signupSuccess"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("error.signupFailed"));
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
      aria-label={tab === "login" ? t("modal.loginTitle") : t("modal.signupTitle")}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          aria-label={ct("close")}
          onClick={onClose}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Lock size={20} strokeWidth={2.5} />
          </div>
          <h2 className={styles.title}>
            {tab === "login" ? t("modal.loginTitle") : t("modal.signupTitle")}
          </h2>
          <p className={styles.sub}>
            {tab === "login"
              ? t("modal.loginSubtitle")
              : t("modal.signupSubtitle")}
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
            {t("tabs.login")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signup"}
            onClick={() => switchTab("signup")}
            className={`${styles.tab} ${tab === "signup" ? styles.tabActive : ""}`}
          >
            {t("tabs.signup")}
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>{t("form.email")}</span>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("form.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </label>
            <label className={styles.field}>
              <div className={styles.labelRow}>
                <span className={styles.label}>{t("form.password")}</span>
                <button
                  type="button"
                  onClick={goForgot}
                  className={styles.forgot}
                >
                  {t("form.forgotPassword")}
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder={t("form.passwordPlaceholder")}
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
              {loading ? t("login.loading") : t("login.label")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>{t("form.email")}</span>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("form.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t("form.passwordHint")}</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t("form.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t("form.confirmPassword")}</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t("form.passwordPlaceholder")}
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
              {loading ? t("signup.loading") : t("signup.label")}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          {tab === "login" ? (
            <>
              {t("footer.noAccount")}
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className={styles.linkBtn}
              >
                {t("footer.signup")}
              </button>
            </>
          ) : (
            <>
              {t("footer.hasAccount")}
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={styles.linkBtn}
              >
                {t("footer.login")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
