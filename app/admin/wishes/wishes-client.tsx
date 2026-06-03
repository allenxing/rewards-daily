"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Lock, Star } from "lucide-react";
import { Tabs } from "@/components/common/tabs";
import { Modal } from "@/components/common/modal";
import { useToast } from "@/components/common/toast";
import { addWishAction, updateWishAction } from "@/lib/actions";
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

  const all = initialWishes;
  const personal = initialWishes.filter((w) => !w.isFamily);
  const family = initialWishes.filter((w) => w.isFamily);

  const tabs = [
    { key: "all", label: "全部愿望", count: all.length },
    { key: "personal", label: "个人愿望", count: personal.length },
    { key: "family", label: "家庭愿望", count: family.length },
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
      ? "家庭"
      : String(kidsList.find((c) => c.name === editingWish.owner)?.id ?? kidsList[0]?.id ?? "")
    : String(kidsList[0]?.id ?? "");

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>愿望管理</h1>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
            onClick={openAdd}
          >
            <Plus size={18} strokeWidth={2.5} />
            新增愿望
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
                  <Star size={12} fill="currentColor" /> {wish.points} 积分
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
                进度:{wish.progress} / {wish.points}
              </div>
            </div>
            <div className={styles.wishFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => openEdit(wish)}
              >
                <Pencil size={12} /> 编辑
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
                <Lock size={12} /> 锁定
              </button>
              <button type="button" className={`${styles.btnGhost} ${styles.btnGhostDanger}`}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={isEdit ? "编辑愿望" : "新增愿望"}
        maxWidth={520}
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
                const form = document.getElementById(`wish-form-${formKey}`) as HTMLFormElement | null;
                if (!form) return;
                const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
                if (!name) {
                  toast.error("请填写愿望名称");
                  return;
                }
                startTransition(async () => {
                  if (isEdit && editingWish) {
                    const fd = new FormData(form);
                    fd.set("wishId", String(editingWish.id));
                    await updateWishAction(fd);
                    toast.success("愿望已更新");
                  } else {
                    await addWishAction(new FormData(form));
                    toast.success("愿望已添加");
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
          id={`wish-form-${formKey}`}
          onSubmit={(e) => e.preventDefault()}
        >
          {isEdit && editingWish ? (
            <input type="hidden" name="wishId" value={String(editingWish.id)} />
          ) : null}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>愿望配图</label>
            <div className={styles.uploadDropzone}>点击上传配图(可选)</div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>愿望名称</label>
            <input
              type="text"
              name="name"
              className={styles.formInput}
              placeholder="如:恐龙模型"
              defaultValue={editingWish?.name ?? ""}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>目标积分</label>
            <input
              type="number"
              name="points"
              className={styles.formInput}
              placeholder="兑换需要的积分"
              min={1}
              defaultValue={editingWish?.points ?? 50}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>归属</label>
            <select
              name="owner"
              className={styles.formInput}
              defaultValue={ownerDefault}
            >
              <optgroup label="个人愿望">
                {kidsList.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="家庭愿望">
                <option value="家庭">家庭(共同)</option>
              </optgroup>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
