"use client";

import { useState, useTransition } from "react";
import { Plus, Minus } from "lucide-react";
import { Modal } from "@/components/common/modal";
import { useToast } from "@/components/common/toast";
import { adjustPointsAction } from "@/lib/actions";
import type { Child } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

type Props = {
  kidsList: Child[];
};

type Mode = "add" | "deduct" | null;

export function FloatingActions({ kidsList }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const close = () => setMode(null);

  const isAdd = mode === "add";
  const title = isAdd ? "手动加分" : "手动扣分";
  const confirmLabel = isAdd ? "确认加分" : "确认扣分";
  const confirmClass = isAdd ? styles.btnPrimary : styles.btnDanger;
  const pointsLabel = isAdd ? "加分数值" : "扣分数值";
  const pointsPlaceholder = isAdd ? "如:5" : "如:5";
  const reasonPlaceholder = isAdd ? "如:主动帮忙做家务" : "如:未完成约定任务";
  const typeValue = isAdd ? "manual" : "deduct";

  return (
    <>
      <div className={styles.fab}>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabBtnSecondary}`}
          onClick={() => setMode("add")}
          title="手动加分"
          aria-label="手动加分"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabBtnSecondary}`}
          onClick={() => setMode("deduct")}
          title="手动扣分"
          aria-label="手动扣分"
        >
          <Minus size={20} strokeWidth={2.5} />
        </button>
      </div>

      <Modal
        open={mode !== null}
        onClose={close}
        title={title}
        maxWidth={440}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={close}
            >
              取消
            </button>
            <button
              type="button"
              className={`${styles.btn} ${confirmClass} ${styles.btnLg}`}
              disabled={pending}
              onClick={() => {
                const form = document.getElementById("adjust-points-form") as HTMLFormElement | null;
                if (!form) return;
                const childId = (form.elements.namedItem("childId") as HTMLSelectElement)?.value;
                const points = Number(
                  (form.elements.namedItem("points") as HTMLInputElement)?.value ?? 0
                );
                if (!childId) {
                  toast.error("请选择孩子");
                  return;
                }
                if (points <= 0) {
                  toast.error("请填写积分(>0)");
                  return;
                }
                startTransition(async () => {
                  const r = await adjustPointsAction(new FormData(form));
                  if (r.ok) {
                    toast.success(`${isAdd ? "已加分" : "已扣分"} ${points}`);
                    close();
                  } else {
                    toast.error(r.error || (isAdd ? "加分失败,请重试" : "扣分失败,积分可能不足"));
                  }
                });
              }}
            >
              {pending ? "处理中…" : confirmLabel}
            </button>
          </>
        }
      >
        <form id="adjust-points-form" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" name="type" value={typeValue} />
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>选择孩子</label>
            <select name="childId" className={styles.formInput} defaultValue="" required>
              <option value="" disabled>
                请选择
              </option>
              {kidsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · 当前 {c.totalPoints} 分
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{pointsLabel}</label>
            <input
              type="number"
              name="points"
              className={styles.formInput}
              placeholder={pointsPlaceholder}
              min={1}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>原因说明</label>
            <input
              type="text"
              name="reason"
              className={styles.formInput}
              placeholder={reasonPlaceholder}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
