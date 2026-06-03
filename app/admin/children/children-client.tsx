"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, User, Copy, Pencil, Check } from "lucide-react";
import { Modal } from "@/components/common/modal";
import { ColorPicker } from "@/components/common/color-picker";
import { useToast } from "@/components/common/toast";
import { addChildAction, deleteChildAction, updateChildAction, uploadAvatarAction } from "@/lib/actions";
import { themePresets } from "@/lib/ui-presets";
import type { Child } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

const themeClassMap: Record<string, string> = {
  sky: styles.themeSky,
  coral: styles.themeCoral,
  mint: styles.themeMint,
  lavender: styles.themeLavender,
  sun: styles.themeSun,
};

type Props = {
  initialChildren: Child[];
};

export function ChildrenClient({ initialChildren }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [themeKey, setThemeKey] = useState("sky");
  const [pending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const toast = useToast();
  const t = useTranslations("admin.children");
  const c = useTranslations("common");
  const e = useTranslations("error");

  const handleCopy = (shareToken: string, id: number) => {
    const url = `${window.location.origin}/child/${shareToken}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(String(id));
    setTimeout(() => setCopiedId(null), 1500);
    toast.success(t("linkCopied"));
  };

  const openAdd = () => {
    setEditingChild(null);
    setThemeKey("sky");
    setAvatarFile(null);
    setFormOpen(true);
  };

  const openEdit = (child: Child) => {
    setEditingChild(child);
    setThemeKey(child.themeKey);
    setAvatarFile(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingChild(null);
    setThemeKey("sky");
    setAvatarFile(null);
  };

  const isEdit = editingChild !== null;
  const formKey = editingChild ? `edit-${editingChild.id}` : "add";
  const activePreset = themePresets.find((p) => p.key === themeKey) ?? themePresets[0];

  const colorOptions = themePresets.map((t) => ({
    key: t.key,
    color: t.color,
    gradient: t.gradient,
    label: t.label,
  }));

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

      <div className={styles.childrenGrid}>
        {initialChildren.map((child) => (
          <div key={child.id} className={styles.childCard}>
            <div className={`${styles.childAvatarLg} ${themeClassMap[child.themeKey] ?? ""}`}>
              <User size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.childCardName}>{child.name}</div>
            <div className={styles.childCardPoints}>{child.totalPoints}</div>
            <div className={styles.childCardLabel}>{t("cumulativePoints")}{child.level}</div>
            <div className={styles.childCardLink}>/child/{child.shareToken.slice(0, 8)}…</div>
            <div className={styles.childCardActions}>
              <a
                href={`/child/${child.shareToken}`}
                target="_blank"
                rel="noreferrer"
                className={styles.childActionEnter}
              >
                <User size={12} /> {t("childMode")}
              </a>
              <button
                type="button"
                className={styles.childActionCopy}
                onClick={() => handleCopy(child.shareToken, child.id)}
              >
                {copiedId === String(child.id) ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === String(child.id) ? t("linkCopied") : t("copyLink")}
              </button>
            </div>
            <div className={`${styles.childCardActions} ${styles.childCardActionsSecondary}`}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => openEdit(child)}
              >
                <Pencil size={12} /> {c("edit")}
              </button>
              <button
                type="button"
                className={`${styles.btnGhost} ${styles.btnGhostDanger}`}
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(t("confirmDelete", { name: child.name }))
                  )
                    return;
                  startTransition(async () => {
                    const r = await deleteChildAction(child.id);
                    if (r.ok) {
                      const c = r.data?.counts;
                      toast.success(
                        t("deleted", { tasks: c?.tasks ?? 0, records: c?.records ?? 0 })
                      );
                    } else {
                      toast.error(e(r.error));
                    }
                  });
                }}
              >
                🗑 {c("delete")}
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className={`${styles.childCard} ${styles.childCardAdd}`}
          onClick={openAdd}
          aria-label={t("addAriaLabel")}
        >
          <div className={styles.addCardIcon}>+</div>
          <div className={styles.addCardTitle}>{t("addCardTitle")}</div>
          <div className={styles.addCardSub}>{t("addCardSub")}</div>
        </button>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={isEdit ? t("editTitle") : t("addTitle")}
        maxWidth={440}
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
                const form = document.getElementById(`child-form-${formKey}`) as HTMLFormElement | null;
                if (!form) return;
                const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
                if (!name) {
                  toast.error(t("nameRequired"));
                  return;
                }
                startTransition(async () => {
                  if (isEdit && editingChild) {
                    const fd = new FormData(form);
                    fd.set("childId", String(editingChild.id));
                    const r = await updateChildAction(fd);
                    if (!r.ok) {
                      toast.error(e(r.error));
                      return;
                    }
                    if (avatarFile) {
                      const afd = new FormData();
                      afd.set("file", avatarFile);
                      const ar = await uploadAvatarAction(editingChild.id, afd);
                      if (!ar.ok) {
                        toast.error(t("toast.avatarUploadFailed", { error: ar.error }));
                        return;
                      }
                    }
                    toast.success(t("toast.updated"));
                  } else {
                    const addFd = new FormData(form);
                    const r = await addChildAction(addFd);
                    if (!r.ok) {
                      toast.error(e(r.error));
                      return;
                    }
                    if (avatarFile && r.data) {
                      const afd = new FormData();
                      afd.set("file", avatarFile);
                      const ar = await uploadAvatarAction(r.data, afd);
                      if (!ar.ok) toast.error(t("toast.avatarUploadFailed", { error: ar.error }));
                    }
                    toast.success(t("toast.added"));
                  }
                  closeForm();
                });
              }}
            >
              {pending
                ? c("saving")
                : isEdit
                  ? c("saveEdit")
                  : c("save")}
            </button>
          </>
        }
      >
        <form
          key={formKey}
          id={`child-form-${formKey}`}
          onSubmit={(e) => e.preventDefault()}
        >
          {isEdit && editingChild ? (
            <input type="hidden" name="childId" value={String(editingChild.id)} />
          ) : null}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("avatarLabel")}</label>
            <div className={styles.avatarUpload}>
              <div
                className={styles.avatarUploadPreview}
                style={
                  avatarFile
                    ? { backgroundImage: `url(${URL.createObjectURL(avatarFile)})`, backgroundSize: "cover" }
                    : editingChild?.avatarUrl
                      ? { backgroundImage: `url(${editingChild.avatarUrl})`, backgroundSize: "cover" }
                      : undefined
                }
              >
                {!avatarFile && !editingChild?.avatarUrl && <User size={28} strokeWidth={1.5} />}
              </div>
              <div className={styles.avatarUploadText}>
                <label className={styles.avatarUploadLink}>
                  {t("uploadAvatar")}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <br />
                {t("orUseDefault")}
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("nameLabel")}</label>
            <input
              type="text"
              name="name"
              className={styles.formInput}
              placeholder={t("namePlaceholder")}
              defaultValue={editingChild?.name ?? ""}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("themeLabel")}</label>
            <ColorPicker
              name="themeKey"
              value={themeKey}
              onChange={(k) => setThemeKey(k)}
              options={colorOptions}
            />
            <input
              type="hidden"
              name="themeColor"
              value={activePreset?.color ?? "#7DD3FC"}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("shareLinkLabel")}</label>
            <div className={styles.formInputRow}>
              <span className={styles.formInputPrefix}>/child/</span>
              <input
                type="text"
                className={styles.formInput}
                readOnly
                value={editingChild?.shareToken ?? t("autoGenerate")}
              />
            </div>
            <div className={styles.formHint}>{t("shareLinkHint")}</div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
