"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Smile, SmilePlus } from "lucide-react";
import type { ReviewItem as ReviewItemData } from "@/lib/ui-types";
import { approveTaskAction, rejectTaskAction } from "@/lib/actions";
import { useToast } from "@/components/common/toast";
import styles from "@/app/admin/admin.module.css";

export function ReviewItem({ item }: { item: ReviewItemData }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const t = useTranslations("admin.review");
  const e = useTranslations("error");
  return (
    <div className={styles.reviewItem}>
      <div
        className={styles.avatar}
        style={{ background: item.themeColor }}
        aria-hidden
      >
        {item.avatarStyle === "smile-plus" ? <SmilePlus size={16} /> : <Smile size={16} />}
      </div>
      <div className={styles.reviewInfo}>
        <div className={styles.reviewTask}>{item.taskName}</div>
        <div className={styles.reviewMeta}>
          <span>{item.childName}</span>
          <span>{item.submitTime}</span>
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            +{item.points} {t("points")}
          </span>
        </div>
      </div>
      <div className={styles.reviewActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await approveTaskAction(item.id);
              if (r.ok) toast.success(`${t("approved")},+${r.data?.points ?? 0} ${t("points")}`);
              else toast.error(e(r.error));
            })
          }
        >
          <Check size={14} strokeWidth={2.5} />
          {t("approve")}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          disabled={pending}
          onClick={() => {
            const reason = window.prompt(t("rejectPrompt")) ?? "";
            startTransition(async () => {
              const r = await rejectTaskAction(item.id, reason);
              if (r.ok) toast.success(t("rejected"));
              else toast.error(e(r.error));
            });
          }}
        >
          <X size={14} strokeWidth={2.5} />
          {t("reject")}
        </button>
      </div>
    </div>
  );
}
