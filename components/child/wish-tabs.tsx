import Link from "next/link";
import styles from "@/app/child/child.module.css";

type Tab = {
  key: string;
  label: string;
  icon?: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  basePath: string;
};

export function WishTabs({ tabs, active, basePath }: Props) {
  return (
    <div className={styles.subTabs}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${basePath}?tab=${tab.key}`}
          className={`${styles.subTab} ${tab.key === active ? styles.active : ""}`}
        >
          {tab.icon ? `${tab.icon} ` : ""}
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
