"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Star,
  LayoutDashboard,
  ListTodo,
  Sparkles,
  Users,
  Coins,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/admin/admin.module.css";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/tasks", labelKey: "tasks", icon: ListTodo },
  { href: "/admin/wishes", labelKey: "wishes", icon: Sparkles },
  { href: "/admin/children", labelKey: "children", icon: Users },
  { href: "/admin/records", labelKey: "records", icon: Coins },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

export function Sidebar() {
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
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
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          <span className={styles.navLinkIcon}>
            <LogOut size={18} strokeWidth={2} />
          </span>
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
