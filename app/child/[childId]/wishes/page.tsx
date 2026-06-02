import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getChildById,
  getChildWishesForChild,
  getChildRedeemHistory,
} from "@/lib/mock-data";
import { ChildShell } from "@/components/child/child-shell";
import { WishCard } from "@/components/child/wish-card";
import { WishTabs } from "@/components/child/wish-tabs";
import styles from "@/app/child/child.module.css";

type Props = {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default function ChildWishesPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <ChildWishesPageInner params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ChildWishesPageInner({ params, searchParams }: Props) {
  const { childId } = await params;
  const { tab = "active" } = await searchParams;
  const child = getChildById(childId);
  if (!child) notFound();

  const wishes = getChildWishesForChild(childId);
  const history = getChildRedeemHistory(childId);

  const tabs = [
    { key: "active", label: "我的心愿", icon: "✨" },
    { key: "history", label: "兑换记录", icon: "📖" },
  ];

  return (
    <ChildShell child={child}>
      <div className={styles.content}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionTitleEmoji}>🎉</span>
          梦想宝库
        </div>
        <p className={styles.sectionSubtitle}>攒够星星就能实现梦想!</p>

        <WishTabs tabs={tabs} active={tab} basePath={`/child/${childId}/wishes`} />

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
              <div className={styles.emptyEmoji}>🎉</div>
              <p>
                还没有兑换过梦想哦
                <br />
                攒够星星就能实现第一个梦想!
              </p>
            </div>
          )
        ) : (
          <div className={styles.wishScrollRow}>
            {wishes.map((wish) => (
              <WishCard key={wish.id} wish={wish} childId={childId} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </ChildShell>
  );
}
