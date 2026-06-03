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

  const [wishes, history] = await Promise.all([
    getWishesForChild(shareToken),
    getRedeemHistoryForChild(shareToken),
  ]);

  const tabs = [
    { key: "active", label: "我的心愿", icon: "✨" },
    { key: "history", label: "兑换记录", icon: "📖" },
  ];

  return (
    <div className={styles.content}>
      <div className={styles.sectionTitle}>
        <span className={styles.sectionTitleEmoji}>🎉</span>
        梦想宝库
      </div>
      <p className={styles.sectionSubtitle}>攒够星星就能实现梦想!</p>

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
            <div className={styles.emptyTitle}>还没有兑换过梦想</div>
            <div>攒够星星就能实现第一个梦想,加油!</div>
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
          <div className={styles.emptyTitle}>梦想宝库还在建设中</div>
          <div>让家长帮你添加几个愿望吧</div>
        </div>
      )}
    </div>
  );
}
