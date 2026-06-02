"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "控制台首页", icon: LayoutDashboard },
  { href: "/admin/tasks", label: "任务管理", icon: ListTodo },
  { href: "/admin/wishes", label: "愿望管理", icon: Sparkles },
  { href: "/admin/children", label: "孩子管理", icon: Users },
  { href: "/admin/records", label: "积分流水记录", icon: Coins },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export function Sidebar() {
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
        <span className={styles.sidebarLogoText}>成长星球</span>
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map(({ href, label, icon: Icon }) => {
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
              {label}
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
          退出登录
        </button>
      </div>
    </aside>
  );
}
