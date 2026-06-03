"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "./auth-modal";
import styles from "@/app/landing.module.css";

type Props = {
  email: string | null;
};

const OPEN_EVENT = "rewards-daily:open-auth";
type Detail = { tab?: "login" | "signup" };

export function UserArea({ email }: Props) {
  const router = useRouter();
  const authT = useTranslations("auth.tabs");
  const sidebarT = useTranslations("admin.sidebar");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<Detail>).detail;
      setTab(detail?.tab ?? "login");
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (email) {
    return (
      <div className={styles.userArea}>
        <span className={styles.userName}>{email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.iconBtn}
          aria-label={sidebarT("logout")}
          title={sidebarT("logout")}
        >
          <LogOut size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.userArea}>
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setOpen(true);
          }}
          className={styles.loginBtn}
        >
          <LogIn size={16} strokeWidth={2.5} />
          {authT("login")}
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("signup");
            setOpen(true);
          }}
          className={styles.signupBtn}
        >
          {authT("signup")}
        </button>
      </div>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        initialTab={tab}
      />
    </>
  );
}

export function openAuthModal(tab: "login" | "signup" = "login"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { tab } }));
}

export function NavbarBrand() {
  const t = useTranslations("landing.nav");
  return (
    <Link href="/" className={styles.brand}>
      <div className={styles.brandLogo} aria-hidden="true">
        ★
      </div>
      <span className={styles.brandName}>{t("brand")}</span>
    </Link>
  );
}
