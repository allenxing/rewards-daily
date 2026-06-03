"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Lock, Star } from "lucide-react";
import { Tabs } from "@/components/common/tabs";
import { Modal } from "@/components/common/modal";
import { useToast } from "@/components/common/toast";
import { addWishAction, deleteWishAction, lockWishAction, updateWishAction } from "@/lib/actions";
import type { Wish, Child } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

type Props = {
  initialWishes: Wish[];
  kidsList: Child[];
};

type TabKey = "all" | "personal" | "family";

export function WishesClient({ initialWishes, kidsList }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const t = useTranslations("admin.wishes");
  const c = useTranslations("common");
  const e = useTranslations("error");

  const all = initialWishes;
  const personal = initialWishes.filter((w) => !w.isFamily);
  const family = initialWishes.filter((w) => w.isFamily);

  const tabs = [
    { key: "all", label: t("tabAll"), count: all.length },
    { key: "personal", label: t("tabPersonal"), count: personal.length },
    { key: "family", label: t("tabFamily"), count: family.length },
  ];

  const visible =
    activeTab === "personal" ? personal : activeTab === "family" ? family : all;

  const openAdd = () => {
    setEditingWish(null);
    setFormOpen(true);
  };

  const openEdit = (wish: Wish) => {
    setEditingWish(wish);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingWish(null);
  };

  const isEdit = editingWish !== null;
  const formKey = editingWish ? `edit-${editingWish.id}` : "add";
  const ownerDefault = editingWish
    ? editingWish.isFamily
      ? "family"
      : String(kidsList.find((c) => c.name === editingWish.owner)?.id ?? kidsList[0]?.id ?? "")
    : String(kidsList[0]?.id ?? "");

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t("pageTitle")}</h1>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
            onClick={openAdd}
          >
            <Plus size={18} strokeWidth={2.5} />
            {t("addTitle")}
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={(k) => setActiveTab(k as TabKey)} />

      <div className={styles.wishGrid}>
        {visible.map((wish) => (
          <div key={wish.id} className={styles.wishCard}>
            <div
              className={styles.wishImage}
              style={wish.gradient ? { background: wish.gradient } : undefined}
            >
              {wish.image}
            </div>
            <div className={styles.wishBody}>
              <div className={styles.wishTitle}>{wish.name}</div>
              <div className={styles.wishMeta}>
                <span className={styles.wishPoints}>
                  <Star size={12} fill="currentColor" /> {t("points", { points: wish.points })}
                </span>
                <span className={styles.wishOwner}>{wish.owner}</span>
              </div>
              <div className={styles.wishProgress}>
                <div
                  className={styles.wishProgressBar}
                  style={{ width: `${Math.min(100, (wish.progress / wish.points) * 100)}%` }}
                />
              </div>
              <div className={styles.wishProgressText}>
                {t("progress", { current: wish.progress, target: wish.points })}
              </div>
            </div>
            <div className={styles.wishFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => openEdit(wish)}
              >
                <Pencil size={12} /> {t("edit")}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const r = await lockWishAction(wish.id, !wish.locked);
                    if (r.ok) toast.success(wish.locked ? t("unlocked") : t("locked"));
                    else toast.error(e(r.error));
                  });
                }}
              >
                <Lock size={12} /> {wish.locked ? t("unlock") : t("lock")}
              </button>
              <button
                type="button"
                className={`${styles.btnGhost} ${styles.btnGhostDanger}`}
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(t("confirmDelete", { name: wish.name }))) return;
                  startTransition(async () => {
                    const r = await deleteWishAction(wish.id);
                    if (r.ok) toast.success(t("toast.deleted"));
                    else toast.error(e(r.error));
                  });
                }}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={isEdit ? t("editTitle") : t("addTitle")}
        maxWidth={520}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={closeForm}
            >
              {c("cancel")}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
              disabled={pending}
              onClick={() => {
                const form = document.getElementById(`wish-form-${formKey}`) as HTMLFormElement | null;
                if (!form) return;
                const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
                if (!name) {
                  toast.error(t("nameRequired"));
                  return;
                }
                startTransition(async () => {
                  if (isEdit && editingWish) {
                    const fd = new FormData(form);
                    fd.set("wishId", String(editingWish.id));
                    const r = await updateWishAction(fd);
                    if (r.ok) toast.success(t("toast.updated"));
                    else toast.error(e(r.error));
                  } else {
                    const r = await addWishAction(new FormData(form));
                    if (r.ok) toast.success(t("toast.added"));
                    else toast.error(e(r.error));
                  }
                  closeForm();
                });
              }}
            >
              {pending ? c("saving") : isEdit ? c("saveEdit") : t("save")}
            </button>
          </>
        }
      >
        <form
          key={formKey}
          id={`wish-form-${formKey}`}
          onSubmit={(e) => e.preventDefault()}
        >
          {isEdit && editingWish ? (
            <input type="hidden" name="wishId" value={String(editingWish.id)} />
          ) : null}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("imageLabel")}</label>
            <div className={styles.uploadDropzone}>{t("uploadImage")}</div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("nameLabel")}</label>
            <input
              type="text"
              name="name"
              className={styles.formInput}
              placeholder={t("namePlaceholder")}
              defaultValue={editingWish?.name ?? ""}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("targetPointsLabel")}</label>
            <input
              type="number"
              name="points"
              className={styles.formInput}
              placeholder={t("targetPlaceholder")}
              min={1}
              defaultValue={editingWish?.points ?? 50}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("ownerLabel")}</label>
            <select
              name="owner"
              className={styles.formInput}
              defaultValue={ownerDefault}
            >
              <optgroup label={t("optPersonal")}>
                {kidsList.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t("optFamily")}>
                <option value="family">{t("optFamilyLabel")}</option>
              </optgroup>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
