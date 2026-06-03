"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin.floatingActions");
  const c = useTranslations("common");
  const e = useTranslations("error");

  const close = () => setMode(null);

  const isAdd = mode === "add";
  const title = isAdd ? t("addTitle") : t("deductTitle");
  const confirmLabel = isAdd ? t("confirmAdd") : t("confirmDeduct");
  const confirmClass = isAdd ? styles.btnPrimary : styles.btnDanger;
  const pointsLabel = isAdd ? t("addLabel") : t("deductLabel");
  const pointsPlaceholder = t("pointsPlaceholder");
  const reasonPlaceholder = isAdd ? t("reasonPlaceholderAdd") : t("reasonPlaceholderDeduct");
  const typeValue = isAdd ? "manual" : "deduct";

  return (
    <>
      <div className={styles.fab}>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabBtnSecondary}`}
          onClick={() => setMode("add")}
          title={t("fabAddTitle")}
          aria-label={t("fabAddTitle")}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabBtnSecondary}`}
          onClick={() => setMode("deduct")}
          title={t("fabDeductTitle")}
          aria-label={t("fabDeductTitle")}
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
              {c("cancel")}
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
                  toast.error(t("selectChild"));
                  return;
                }
                if (points <= 0) {
                  toast.error(t("enterPoints"));
                  return;
                }
                startTransition(async () => {
                  const r = await adjustPointsAction(new FormData(form));
                  if (r.ok) {
                    toast.success(`${isAdd ? t("successAdd") : t("successDeduct")} ${points}`);
                    close();
                  } else {
                    toast.error(e(r.error) || (isAdd ? t("errorAdd") : t("errorDeduct")));
                  }
                });
              }}
            >
              {pending ? t("processing") : confirmLabel}
            </button>
          </>
        }
      >
        <form id="adjust-points-form" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" name="type" value={typeValue} />
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("childSelectLabel")}</label>
            <select name="childId" className={styles.formInput} defaultValue="" required>
              <option value="" disabled>
                {t("childSelectPlaceholder")}
              </option>
              {kidsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {t("currentPoints")} {c.totalPoints}
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
            <label className={styles.formLabel}>{t("reasonLabel")}</label>
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
