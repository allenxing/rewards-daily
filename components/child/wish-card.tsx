"use client";

import { useState, useTransition } from "react";
import type { ChildWish } from "@/lib/mock-data";
import { redeemWishAction } from "@/lib/actions";
import { useToast } from "@/components/common/toast";
import { Confetti } from "./confetti";
import styles from "@/app/child/child.module.css";

type Props = {
  wish: ChildWish;
  childId: string;
  variant?: "scroll" | "grid";
};

export function WishCard({ wish, childId, variant = "scroll" }: Props) {
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [confettiCount, setConfettiCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const percent = Math.min(100, Math.round((wish.current / wish.cost) * 100));
  const completed = wish.current >= wish.cost;

  const handleConfirm = () => {
    startTransition(async () => {
      const ok = await redeemWishAction(wish.id, childId);
      if (ok) {
        setRedeemOpen(false);
        setConfettiCount((c) => c + 1);
        toast.success(`已兑换「${wish.name}」!`);
      } else {
        toast.error("兑换失败,请重试");
      }
    });
  };

  return (
    <>
      <div
        className={`${styles.wishCard} ${variant === "grid" ? styles.full : ""} ${
          completed ? styles.completed : ""
        }`}
      >
        <div className={styles.wishEmoji}>{wish.emoji}</div>
        <div className={styles.wishName}>{wish.name}</div>
        <div className={styles.wishCost}>⭐ {wish.cost}</div>
        <div className={styles.wishProgress}>
          <div
            className={`${styles.wishProgressBar} ${styles[wish.color] ?? ""}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div
          className={`${styles.wishProgressText} ${completed ? styles.completed : ""}`}
        >
          {wish.current} / {wish.cost} 星星 {completed ? "🎉" : ""}
        </div>
        {completed && (
          <button
            type="button"
            className={styles.wishRedeem}
            onClick={() => setRedeemOpen(true)}
          >
            🎁 兑换这个梦想
          </button>
        )}
      </div>

      {redeemOpen && (
        <div
          className={styles.redeemModal}
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setRedeemOpen(false)}
        >
          <div
            className={styles.redeemDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.redeemEmoji}>{wish.emoji}</div>
            <div className={styles.redeemTitle}>兑换「{wish.name}」</div>
            <div className={styles.redeemDesc}>
              确认要用星星兑换这个梦想吗?兑换后星星将被扣除。
            </div>
            <div className={styles.redeemCost}>⭐ {wish.cost} 星星</div>
            <div className={styles.redeemBtns}>
              <button
                type="button"
                className={styles.redeemCancel}
                onClick={() => setRedeemOpen(false)}
                disabled={pending}
              >
                再想想
              </button>
              <button
                type="button"
                className={styles.redeemConfirm}
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? "兑换中…" : "确认兑换!"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Confetti trigger={confettiCount} />
    </>
  );
}
