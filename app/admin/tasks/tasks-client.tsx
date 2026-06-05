"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Lock, Check, Star, Pencil, FilePlus } from "lucide-react";
import { Modal } from "@/components/common/modal";
import { Tabs } from "@/components/common/tabs";
import { useToast } from "@/components/common/toast";
import { addTaskAction, closeTaskAction, restoreTaskAction, updateTaskAction } from "@/lib/actions";
import type { Task, Child } from "@/lib/ui-types";
import { iconPresets } from "@/lib/ui-presets";
import styles from "@/app/admin/admin.module.css";

type Props = {
  tasks: Task[];
  kidsList: Child[];
};

export function TasksClient({ tasks, kidsList: kids }: Props) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [closeTaskId, setCloseTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [pending, startTransition] = useTransition();
  const [iconPick, setIconPick] = useState("⭐");
  const [autoCheck, setAutoCheck] = useState(false);
  const toast = useToast();
  const t = useTranslations("admin.tasks");
  const c = useTranslations("common");
  const e = useTranslations("error");

  const activeTasks = tasks.filter((t) => t.status === "active");
  const closedTasks = tasks.filter((t) => t.status === "closed");

  const tabs = [
    { key: "active", label: t("tabActive"), count: activeTasks.length },
    { key: "closed", label: t("tabClosed"), count: closedTasks.length },
  ];

  const visibleTasks = activeTab === "active" ? activeTasks : closedTasks;

  const openAdd = () => {
    setEditingTask(null);
    setIconPick("⭐");
    setAutoCheck(false);
    setAddOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setIconPick(task.icon);
    setAutoCheck(task.autoCheck);
    setAddOpen(true);
  };

  const closeForm = () => {
    setAddOpen(false);
    setEditingTask(null);
    setIconPick("⭐");
    setAutoCheck(false);
  };

  const isEdit = editingTask !== null;
  const formKey = editingTask ? `edit-${editingTask.id}` : "add";

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

      <Tabs
        tabs={tabs}
        active={activeTab}
        onChange={(k) => setActiveTab(k as "active" | "closed")}
      />

      {visibleTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FilePlus size={48} strokeWidth={1.5} />
          </div>
          <div className={styles.emptyStateText}>{t("emptyActive")}</div>
        </div>
      ) : (
        visibleTasks.map((task) => (
          <div
            key={task.id}
            className={`${styles.taskRow} ${task.status === "closed" ? styles.taskRowClosed : ""}`}
          >
            <div
              className={styles.taskIconCell}
              style={{ background: task.iconBg, color: task.iconColor }}
            >
              {task.icon}
            </div>
            <div className={styles.taskNameCell}>
              <div className={styles.taskNameTitle}>{task.name}</div>
              <div className={styles.taskMeta}>
                <span>
                  {task.cycle === "daily"
                    ? t("cycleDaily")
                    : task.cycle === "weekly"
                      ? t("cycleWeekly")
                      : t("cycleOnce")}
                </span>
                <span>·</span>
                <span>{task.assignedChildNames.join("、") || t("unassigned")}</span>
                {task.status === "closed" && task.closedReason ? (
                  <>
                    <span>·</span>
                    <span>{t("closedReasonPrefix")}{task.closedReason}</span>
                  </>
                ) : (
                  <>
                    <span>·</span>
                    <span>{task.autoCheck ? t("autoReview") : t("manualReview")}</span>
                  </>
                )}
              </div>
            </div>
            <div className={styles.taskPointsCell}>
              <Star size={14} fill="currentColor" /> +{task.points}
            </div>
            <div className={styles.taskActionsCell}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => openEdit(task)}
                aria-label={t("editAriaLabel")}
                title={t("editButton")}
              >
                <Pencil size={14} />
              </button>
              {task.status === "active" ? (
                <button
                  type="button"
                  className={`${styles.taskToggleBtn} ${styles.taskToggleBtnDisable}`}
                  onClick={() => setCloseTaskId(task.id)}
                >
                  <Lock size={12} />
                  {t("close")}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.taskRestoreBtn}
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const r = await restoreTaskAction(task.id);
                      if (r.ok) toast.success(t("toast.restored"));
                      else toast.error(e(r.error));
                    });
                  }}
                >
                  <Check size={12} />
                  {t("restore")}
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <Modal
        open={addOpen}
        onClose={closeForm}
        title={isEdit ? t("editTitle") : t("addTitle")}
        maxWidth={560}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={closeForm}
            >
              {c("cancel")}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={pending}
              onClick={() => {
                const form = document.getElementById(`task-form-${formKey}`) as HTMLFormElement | null;
                if (!form) return;
                const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
                if (!name) {
                  toast.error(t("toast.nameRequired"));
                  return;
                }
                startTransition(async () => {
                  if (isEdit && editingTask) {
                    const fd = new FormData(form);
                    fd.set("taskId", String(editingTask.id));
                    const r = await updateTaskAction(fd);
                    if (r.ok) toast.success(t("toast.updated"));
                    else toast.error(e(r.error));
                  } else {
                    const r = await addTaskAction(new FormData(form));
                    if (r.ok) toast.success(t("toast.created"));
                    else toast.error(e(r.error));
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
          id={`task-form-${formKey}`}
          onSubmit={(e) => e.preventDefault()}
        >
          {isEdit && editingTask ? (
            <input type="hidden" name="taskId" value={String(editingTask.id)} />
          ) : null}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("nameLabel")}</label>
            <input
              type="text"
              name="name"
              className={styles.formInput}
              placeholder={t("namePlaceholder")}
              defaultValue={editingTask?.name ?? ""}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("iconLabel")}</label>
            <input type="hidden" name="icon" value={iconPick} />
            <div className={styles.iconGrid}>
              {iconPresets.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  className={`${styles.iconOption} ${iconPick === emoji ? styles.iconOptionSelected : ""}`}
                  onClick={() => setIconPick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formInputRow}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>{t("pointsLabel")}</label>
              <input
                type="number"
                name="points"
                className={styles.formInput}
                min={1}
                defaultValue={editingTask?.points ?? 5}
                required
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>{t("cycleLabel")}</label>
              <select
                name="cycle"
                className={styles.formInput}
                defaultValue={editingTask?.cycle ?? "daily"}
              >
                <option value="daily">{t("cycleDaily")}</option>
                <option value="weekly">{t("cycleWeekly")}</option>
                <option value="once">{t("cycleOnce")}</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("assignLabel")}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {kids.map((kid) => (
                <label key={kid.id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="assignedChildren"
                    value={String(kid.id)}
                    defaultChecked={
                      isEdit
                        ? editingTask!.assignedChildren.includes(kid.id)
                        : true
                    }
                  />
                  <span>{kid.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="autoCheck"
                checked={autoCheck}
                onChange={(e) => setAutoCheck(e.target.checked)}
              />
              <span>{t("autoCheckLabel")}</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={closeTaskId !== null}
        onClose={() => setCloseTaskId(null)}
        title={t("closeTitle")}
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => setCloseTaskId(null)}
            >
              {c("cancel")}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              disabled={pending || !closeTaskId}
              onClick={() => {
                if (!closeTaskId) return;
                const reason =
                  (document.getElementById("close-reason-select") as HTMLSelectElement | null)
                    ?.value ?? t("closeReasonDefault");
                const fd = new FormData();
                fd.set("taskId", String(closeTaskId));
                fd.set("reason", reason);
                startTransition(async () => {
                  const r = await closeTaskAction(fd);
                  setCloseTaskId(null);
                  if (r.ok) toast.success(t("toast.closed"));
                  else toast.error(e(r.error));
                });
              }}
            >
              {pending ? c("loading") : t("confirmClose")}
            </button>
          </>
        }
      >
        <p className={styles.formHint}>
          {t("closeHint")}
        </p>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t("closeReasonLabel")}</label>
          <select id="close-reason-select" className={styles.formInput} defaultValue={t("closeReasonDefault")}>
            <option>{t("closeReasonDefault")}</option>
            <option>{t("closeReasonMastered")}</option>
            <option>{t("closeReasonDuplicate")}</option>
            <option>{t("closeReasonOther")}</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
