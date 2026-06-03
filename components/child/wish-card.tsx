"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { ChildWish } from "@/lib/ui-types";
import { redeemWishAction } from "@/lib/actions";
import { useToast } from "@/components/common/toast";
import { Confetti } from "./confetti";
import styles from "@/app/child/child.module.css";

type Props = {
  wish: ChildWish;
  shareToken: string;
  variant?: "scroll" | "grid";
};

export function WishCard({ wish, shareToken, variant = "scroll" }: Props) {
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [confettiCount, setConfettiCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const t = useTranslations("child.wishCard");

  const percent = Math.min(100, Math.round((wish.current / wish.cost) * 100));
  const completed = wish.current >= wish.cost;

  const handleConfirm = () => {
    startTransition(async () => {
      const r = await redeemWishAction({ wishId: wish.id, shareToken });
      if (r.ok) {
        setRedeemOpen(false);
        setConfettiCount((c) => c + 1);
        toast.success(t("redeemed", { name: wish.name }));
      } else {
        toast.error(r.error || t("redeemError"));
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
          {t("stars", { current: wish.current, cost: wish.cost })}{completed ? " 🎉" : ""}
        </div>
        {completed && (
          <button
            type="button"
            className={styles.wishRedeem}
            onClick={() => setRedeemOpen(true)}
          >
            {t("redeemButton")}
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
            <div className={styles.redeemTitle}>{t("modalTitle", { name: wish.name })}</div>
            <div className={styles.redeemDesc}>{t("modalDesc")}</div>
            <div className={styles.redeemCost}>{t("modalCost", { cost: wish.cost })}</div>
            <div className={styles.redeemBtns}>
              <button
                type="button"
                className={styles.redeemCancel}
                onClick={() => setRedeemOpen(false)}
                disabled={pending}
              >
                {t("modalCancel")}
              </button>
              <button
                type="button"
                className={styles.redeemConfirm}
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? t("modalConfirming") : t("modalConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Confetti trigger={confettiCount} />
    </>
  );
}
