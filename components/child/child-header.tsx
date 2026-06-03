import { Smile, SmilePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import styles from "@/app/child/child.module.css";

type Props = {
  childId: number;
  shareToken?: string;
  name: string;
  totalPoints: number;
  themeColor: string;
  avatarStyle: "smile" | "smile-plus";
};

export async function ChildHeader({
  childId,
  shareToken,
  name,
  totalPoints,
  themeColor,
  avatarStyle,
}: Props) {
  const t = await getTranslations("child.header");
  return (
    <header className={styles.header}>
      <div
        className={styles.avatar}
        style={{ background: themeColor }}
        aria-label={t("avatarLabel")}
      >
        {avatarStyle === "smile-plus" ? <SmilePlus size={20} /> : <Smile size={20} />}
      </div>
      <div className={styles.greeting}>
        <div className={styles.name}>{t("greeting", { name })}</div>
        <div className={styles.sub}>{t("subGreeting")}</div>
      </div>
      <div className={styles.starCounter}>
        <span className={styles.starIcon}>⭐</span>
        <span>{totalPoints}</span>
      </div>
      <input type="hidden" data-child-id={childId} data-share-token={shareToken ?? ""} />
    </header>
  );
}
