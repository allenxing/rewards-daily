"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import type { ReviewItem as ReviewItemData } from "@/lib/ui-types";
import { approveTaskAction, rejectTaskAction } from "@/lib/actions";
import { useToast } from "@/components/common/toast";
import styles from "@/app/admin/admin.module.css";

export function ReviewItem({ item }: { item: ReviewItemData }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <div className={styles.reviewItem}>
      <div
        className={styles.avatar}
        style={{ background: item.avatarBg, color: item.avatarFg }}
        aria-hidden
      >
        {item.childName.charAt(0)}
      </div>
      <div className={styles.reviewInfo}>
        <div className={styles.reviewTask}>{item.taskName}</div>
        <div className={styles.reviewMeta}>
          <span>{item.childName}</span>
          <span>{item.submitTime}</span>
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            +{item.points} 积分
          </span>
        </div>
      </div>
      <div className={styles.reviewActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSuccess}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await approveTaskAction(item.id);
              if (r.ok) toast.success(`已通过,+${r.data?.points ?? 0} 积分`);
              else toast.error(r.error);
            })
          }
        >
          <Check size={14} strokeWidth={2.5} />
          通过
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          disabled={pending}
          onClick={() => {
            const reason = window.prompt("请输入拒绝原因(可选)") ?? "";
            startTransition(async () => {
              const r = await rejectTaskAction(item.id, reason);
              if (r.ok) toast.success("已拒绝");
              else toast.error(r.error);
            });
          }}
        >
          <X size={14} strokeWidth={2.5} />
          拒绝
        </button>
      </div>
    </div>
  );
}
