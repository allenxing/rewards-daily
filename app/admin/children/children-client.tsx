"use client";

import { useState, useTransition } from "react";
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

  const handleCopy = (shareToken: string, id: number) => {
    const url = `${window.location.origin}/child/${shareToken}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(String(id));
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("链接已复制");
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
        <h1 className={styles.pageTitle}>孩子管理</h1>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
            onClick={openAdd}
          >
            <Plus size={18} strokeWidth={2.5} />
            新增孩子
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
            <div className={styles.childCardLabel}>累计积分 · Lv.{child.level}</div>
            <div className={styles.childCardLink}>/child/{child.shareToken.slice(0, 8)}…</div>
            <div className={styles.childCardActions}>
              <a
                href={`/child/${child.shareToken}`}
                target="_blank"
                rel="noreferrer"
                className={styles.childActionEnter}
              >
                <User size={12} /> 孩子模式
              </a>
              <button
                type="button"
                className={styles.childActionCopy}
                onClick={() => handleCopy(child.shareToken, child.id)}
              >
                {copiedId === String(child.id) ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === String(child.id) ? "已复制" : "复制地址"}
              </button>
            </div>
            <div className={`${styles.childCardActions} ${styles.childCardActionsSecondary}`}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => openEdit(child)}
              >
                <Pencil size={12} /> 编辑
              </button>
              <button
                type="button"
                className={`${styles.btnGhost} ${styles.btnGhostDanger}`}
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `确定删除「${child.name}」?\n将同时删除该孩子的任务记录、积分流水和愿望。此操作不可恢复。`
                    )
                  )
                    return;
                  startTransition(async () => {
                    const r = await deleteChildAction(child.id);
                    if (r.ok) {
                      const c = r.data?.counts;
                      toast.success(
                        `已删除 (任务 ${c?.tasks ?? 0} · 流水 ${c?.records ?? 0})`
                      );
                    } else {
                      toast.error(r.error);
                    }
                  });
                }}
              >
                🗑 删除
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className={`${styles.childCard} ${styles.childCardAdd}`}
          onClick={openAdd}
          aria-label="添加新孩子"
        >
          <div className={styles.addCardIcon}>+</div>
          <div className={styles.addCardTitle}>添加新孩子</div>
          <div className={styles.addCardSub}>自动生成专属路由</div>
        </button>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={isEdit ? "编辑孩子" : "新增孩子"}
        maxWidth={440}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={closeForm}
            >
              取消
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
                  toast.error("请填写昵称");
                  return;
                }
                startTransition(async () => {
                  if (isEdit && editingChild) {
                    const fd = new FormData(form);
                    fd.set("childId", String(editingChild.id));
                    const r = await updateChildAction(fd);
                    if (!r.ok) {
                      toast.error(r.error);
                      return;
                    }
                    if (avatarFile) {
                      const afd = new FormData();
                      afd.set("file", avatarFile);
                      const ar = await uploadAvatarAction(editingChild.id, afd);
                      if (!ar.ok) {
                        toast.error(`头像上传失败: ${ar.error}`);
                        return;
                      }
                    }
                    toast.success("孩子已更新");
                  } else {
                    const addFd = new FormData(form);
                    const r = await addChildAction(addFd);
                    if (!r.ok) {
                      toast.error(r.error);
                      return;
                    }
                    if (avatarFile && r.data) {
                      const afd = new FormData();
                      afd.set("file", avatarFile);
                      const ar = await uploadAvatarAction(r.data, afd);
                      if (!ar.ok) toast.error(`头像上传失败: ${ar.error}`);
                    }
                    toast.success("孩子已添加");
                  }
                  closeForm();
                });
              }}
            >
              {pending
                ? isEdit
                  ? "保存中…"
                  : "保存中…"
                : isEdit
                  ? "保存修改"
                  : "保存"}
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
            <label className={styles.formLabel}>头像</label>
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
                  点击上传头像
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <br />
                或使用默认头像
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>昵称</label>
            <input
              type="text"
              name="name"
              className={styles.formInput}
              placeholder="如:小明"
              defaultValue={editingChild?.name ?? ""}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>主题色</label>
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
            <label className={styles.formLabel}>专属分享链接</label>
            <div className={styles.formInputRow}>
              <span className={styles.formInputPrefix}>/child/</span>
              <input
                type="text"
                className={styles.formInput}
                readOnly
                value={editingChild?.shareToken ?? "(新建后自动生成)"}
              />
            </div>
            <div className={styles.formHint}>新链接在孩子创建后自动生成,可点击「复制地址」获取</div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
