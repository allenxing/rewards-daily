import { getTranslations } from "next-intl/server";
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

export async function ChildHeader({
  childId,
  shareToken,
  name,
  totalPoints,
  avatarBg,
  avatarColor,
  avatarUrl,
}: Props) {
  const t = await getTranslations("child.header");
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
        aria-label={t("avatarLabel")}
      >
        {!avatarUrl ? "✨" : ""}
      </div>
      <div className={styles.greeting}>
        <div className={styles.name}>{t("greeting", { name })}</div>
        <div className={styles.sub}>{t("subGreeting")}</div>
      </div>
      <Link
        href="/admin/children"
        className={styles.starCounter}
        aria-label={t("parentEntry")}
      >
        <span className={styles.starIcon}>⭐</span>
        <span>{totalPoints}</span>
      </Link>
      <input type="hidden" data-child-id={childId} data-share-token={shareToken ?? ""} />
    </header>
  );
}
