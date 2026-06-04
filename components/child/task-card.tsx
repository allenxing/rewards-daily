"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { ChildTask } from "@/lib/ui-types";
import { useToast } from "@/components/common/toast";
import styles from "@/app/child/child.module.css";

type Props = {
  task: ChildTask;
  shareToken: string;
  onSubmit?: (taskId: number) => void;
};

export function TaskCard({ task, shareToken, onSubmit }: Props) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const t = useTranslations("child.taskCard");
  void shareToken;

  const pointsDisplay = task.points < 0 ? `-${Math.abs(task.points)}` : `+${task.points}`;

  if (task.status === "done") {
    return (
      <div className={`${styles.taskCard} ${styles.done}`}>
        <div className={`${styles.taskIcon} ${styles[task.iconClass] ?? ""}`}>
          {task.icon}
        </div>
        <div className={styles.taskInfo}>
          <div className={styles.taskName}>{task.name}</div>
          <div className={styles.taskDetail}>{task.detail}</div>
        </div>
        <div className={`${styles.taskPoints} ${styles.done}`}>⭐ {pointsDisplay}</div>
        <div className={styles.taskDone}>{t("doneBadge")}</div>
      </div>
    );
  }

  if (task.status === "pending") {
    return (
      <div className={styles.taskCard}>
        <div className={`${styles.taskIcon} ${styles[task.iconClass] ?? ""}`}>
          {task.icon}
        </div>
        <div className={styles.taskInfo}>
          <div className={styles.taskName}>{task.name}</div>
          <div className={styles.taskDetail}>{task.detail}</div>
        </div>
        <div className={styles.taskPoints}>⭐ {pointsDisplay}</div>
        <div className={styles.taskPending}>{t("pendingBadge")}</div>
      </div>
    );
  }

  return (
    <div className={styles.taskCard}>
      <div className={`${styles.taskIcon} ${styles[task.iconClass] ?? ""}`}>
        {task.icon}
      </div>
      <div className={styles.taskInfo}>
        <div className={styles.taskName}>{task.name}</div>
        <div className={styles.taskDetail}>{task.detail}</div>
      </div>
      <div className={styles.taskPoints}>⭐ {pointsDisplay}</div>
      <button
        type="button"
        className={styles.taskSubmit}
        disabled={pending}
        onClick={() => {
          if (!onSubmit) return;
          startTransition(async () => {
            await onSubmit(task.id);
            toast.success(t("submitted"));
          });
        }}
      >
        {pending ? t("submitting") : t("complete")}
      </button>
    </div>
  );
}
