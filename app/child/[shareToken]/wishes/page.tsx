import { getTranslations } from "next-intl/server";
import { Gift, Sparkles } from "lucide-react";
import { getWishesForChild, getRedeemHistoryForChild } from "@/lib/queries/wishes";
import { WishCard } from "@/components/child/wish-card";
import { WishTabs } from "@/components/child/wish-tabs";
import styles from "@/app/child/child.module.css";

type Props = {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ChildWishesPage({ params, searchParams }: Props) {
  const { shareToken } = await params;
  const { tab = "active" } = await searchParams;
  const t = await getTranslations("child.wishes");

  const [wishes, history] = await Promise.all([
    getWishesForChild(shareToken),
    getRedeemHistoryForChild(shareToken),
  ]);

  const tabs = [
    { key: "active", label: t("tabWishes"), icon: "✨" },
    { key: "history", label: t("tabHistory"), icon: "📖" },
  ];

  return (
    <div className={styles.content}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleEmoji}>🎉</span>
        {t("sectionTitle")}
      </div>
      <p className={styles.sectionSubtitle}>{t("sectionSubtitle")}</p>

      <WishTabs tabs={tabs} active={tab} basePath={`/child/${shareToken}/wishes`} />

      {tab === "history" ? (
        history.length > 0 ? (
          <div className={styles.historyList}>
            {history.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div
                  className={styles.historyIcon}
                  style={{ background: item.iconBg }}
                >
                  {item.emoji}
                </div>
                <div className={styles.historyInfo}>
                  <div className={styles.historyName}>{item.name}</div>
                  <div className={styles.historyDate}>{item.date}</div>
                </div>
                <div className={styles.historyCost}>⭐ {item.cost}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <Gift size={48} strokeWidth={1.5} className={styles.emptyEmoji} />
            <div className={styles.emptyTitle}>{t("emptyHistory.title")}</div>
            <div>{t("emptyHistory.desc")}</div>
          </div>
        )
      ) : wishes.length > 0 ? (
        <div className={styles.wishScrollRow}>
          {wishes.map((wish) => (
            <WishCard key={wish.id} wish={wish} shareToken={shareToken} variant="grid" />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Sparkles size={48} strokeWidth={1.5} className={styles.emptyEmoji} />
          <div className={styles.emptyTitle}>{t("emptyWishes.title")}</div>
          <div>{t("emptyWishes.desc")}</div>
        </div>
      )}
    </div>
  );
}
