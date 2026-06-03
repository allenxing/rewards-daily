import Link from "next/link";
import styles from "@/app/child/child.module.css";

type Props = {
  childId: number;
  shareToken?: string;
  name: string;
  totalPoints: number;
  avatarBg: string;
  avatarColor: string;
  avatarUrl: string | null;
};

export function ChildHeader({
  childId,
  shareToken,
  name,
  totalPoints,
  avatarBg,
  avatarColor,
  avatarUrl,
}: Props) {
  return (
    <header className={styles.header}>
      <div
        className={styles.avatar}
        style={{
          background: avatarUrl ? "transparent" : avatarBg,
          color: avatarColor,
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-label="孩子头像"
      >
        {!avatarUrl ? "✨" : ""}
      </div>
      <div className={styles.greeting}>
        <div className={styles.name}>嗨,{name}!</div>
        <div className={styles.sub}>今天也要加油哦</div>
      </div>
      <Link
        href="/admin/children"
        className={styles.starCounter}
        aria-label="查看家长入口"
      >
        <span className={styles.starIcon}>⭐</span>
        <span>{totalPoints}</span>
      </Link>
      <input type="hidden" data-child-id={childId} data-share-token={shareToken ?? ""} />
    </header>
  );
}
