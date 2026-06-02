import Link from "next/link";
import styles from "@/app/child/child.module.css";

type Props = {
  childId: string;
  name: string;
  totalPoints: number;
  avatarBg: string;
  avatarColor: string;
};

export function ChildHeader({ childId, name, totalPoints, avatarBg, avatarColor }: Props) {
  return (
    <header className={styles.header}>
      <div
        className={styles.avatar}
        style={{ background: avatarBg, color: avatarColor }}
        aria-label="孩子头像"
      >
        ✨
      </div>
      <div className={styles.greeting}>
        <div className={styles.name}>嗨,{name}!</div>
        <div className={styles.sub}>今天也要加油哦</div>
      </div>
      <Link
        href={`/admin/children`}
        className={styles.starCounter}
        aria-label="查看家长入口"
      >
        <span className={styles.starIcon}>⭐</span>
        <span>{totalPoints}</span>
      </Link>
      <input type="hidden" data-child-id={childId} />
    </header>
  );
}
