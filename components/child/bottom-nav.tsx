"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import styles from "@/app/child/child.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
};

export function ChildBottomNav({
  childId,
  shareToken,
}: {
  childId: number;
  shareToken?: string;
}) {
  const pathname = usePathname();
  const base = shareToken ? `/child/${shareToken}` : `/child/${childId}`;
  const t = useTranslations("child.nav");

  const items: NavItem[] = [
    { href: base, label: t("home"), icon: "🏠", match: (p) => p === base },
    {
      href: `${base}/tasks`,
      label: t("tasks"),
      icon: "📋",
      match: (p) => p.startsWith(`${base}/tasks`),
    },
    {
      href: `${base}/wishes`,
      label: t("wishes"),
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
