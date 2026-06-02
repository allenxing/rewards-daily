"use client";

import styles from "@/app/admin/admin.module.css";

export type TabItem = {
  key: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: TabItem[];
  active: string;
  onChange?: (key: string) => void;
};

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className={styles.pageTabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === active}
          className={`${styles.pageTab} ${tab.key === active ? styles.pageTabActive : ""}`}
          onClick={() => onChange?.(tab.key)}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span className={styles.tabCount}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
