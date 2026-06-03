"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, X, LogOut, Star, LayoutDashboard, ListTodo, Sparkles, Users, Coins, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { FloatingActions } from "./floating-actions";
import { createClient } from "@/lib/supabase/client";
import type { Child } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

const navItems = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/tasks", labelKey: "tasks", icon: ListTodo },
  { href: "/admin/wishes", labelKey: "wishes", icon: Sparkles },
  { href: "/admin/children", labelKey: "children", icon: Users },
  { href: "/admin/records", labelKey: "records", icon: Coins },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
] as const;

export function AdminShell({
  kids,
  userEmail,
  children: pageContent,
}: {
  kids: Child[];
  userEmail: string;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin.sidebar");

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Mobile drawer — single position:fixed element */}
      {sidebarOpen && (
        <div className={styles.mobileDrawer} onClick={() => setSidebarOpen(false)}>
          <div className={styles.mobileDrawerPanel} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.mobileCloseBtn}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={2} />
            </button>

            <div className={styles.sidebarLogo}>
              <div className={styles.sidebarLogoIcon}>
                <Star size={20} strokeWidth={2.5} fill="currentColor" />
              </div>
              <span className={styles.sidebarLogoText}>{t("brand")}</span>
            </div>

            <nav className={styles.sidebarNav}>
              {navItems.map(({ href, labelKey, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  >
                    <span className={styles.navLinkIcon}>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    {t(labelKey)}
                  </Link>
                );
              })}
            </nav>

            <div className={styles.sidebarFooter}>
              <div className={styles.sidebarEmail}>{userEmail}</div>
              <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
                <span className={styles.navLinkIcon}>
                  <LogOut size={18} strokeWidth={2} />
                </span>
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar (hidden on mobile via CSS) */}
      <Sidebar
        userEmail={userEmail}
        open={sidebarOpen}
        closeButton={
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={2} />
          </button>
        }
      />

      <div className={styles.shell}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <main className={styles.main}>
          {pageContent}
        </main>
      </div>

      <FloatingActions kidsList={kids} />
    </>
  );
}
