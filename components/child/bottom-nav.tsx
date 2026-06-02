"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/child/child.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
};

export function ChildBottomNav({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/child/${childId}`;

  const items: NavItem[] = [
    {
      href: base,
      label: "首页",
      icon: "🏠",
      match: (p) => p === base,
    },
    {
      href: `${base}/tasks`,
      label: "任务",
      icon: "📋",
      match: (p) => p.startsWith(`${base}/tasks`),
    },
    {
      href: `${base}/wishes`,
      label: "梦想",
      icon: "🎉",
      match: (p) => p.startsWith(`${base}/wishes`),
    },
  ];

  return (
    <nav className={styles.bottomNav}>
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${active ? styles.active : ""}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
