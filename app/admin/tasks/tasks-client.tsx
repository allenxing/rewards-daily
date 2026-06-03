"use client";

import { useState, useTransition } from "react";
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
  const toast = useToast();

  const activeTasks = tasks.filter((t) => t.status === "active");
  const closedTasks = tasks.filter((t) => t.status === "closed");

  const tabs = [
    { key: "active", label: "全部任务", count: activeTasks.length },
    { key: "closed", label: "已关闭任务", count: closedTasks.length },
  ];

  const visibleTasks = activeTab === "active" ? activeTasks : closedTasks;

  const openAdd = () => {
    setEditingTask(null);
    setIconPick("⭐");
    setAddOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setIconPick(task.icon);
    setAddOpen(true);
  };

  const closeForm = () => {
    setAddOpen(false);
    setEditingTask(null);
    setIconPick("⭐");
  };

  const isEdit = editingTask !== null;
  const formKey = editingTask ? `edit-${editingTask.id}` : "add";

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>任务管理</h1>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
            onClick={openAdd}
          >
            <Plus size={18} strokeWidth={2.5} />
            新增任务
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
          <div className={styles.emptyStateText}>还没有创建任务</div>
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
                    ? "每天"
                    : task.cycle === "weekly"
                      ? "每周"
                      : "一次性"}
                </span>
                <span>·</span>
                <span>{task.assignedChildNames.join("、") || "未指派"}</span>
                {task.status === "closed" && task.closedReason ? (
                  <>
                    <span>·</span>
                    <span>关闭原因:{task.closedReason}</span>
                  </>
                ) : (
                  <>
                    <span>·</span>
                    <span>自动审核</span>
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
                aria-label="编辑任务"
                title="编辑"
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
                  关闭
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.taskRestoreBtn}
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const r = await restoreTaskAction(task.id);
                      if (r.ok) toast.success("已恢复");
                      else toast.error(r.error);
                    });
                  }}
                >
                  <Check size={12} />
                  恢复启用
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <Modal
        open={addOpen}
        onClose={closeForm}
        title={isEdit ? "编辑任务" : "新增任务"}
        maxWidth={560}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={closeForm}
            >
              取消
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
                  toast.error("请填写任务名称");
                  return;
                }
                startTransition(async () => {
                  if (isEdit && editingTask) {
                    const fd = new FormData(form);
                    fd.set("taskId", String(editingTask.id));
                    const r = await updateTaskAction(fd);
                    if (r.ok) toast.success("任务已更新");
                    else toast.error(r.error);
                  } else {
                    const r = await addTaskAction(new FormData(form));
                    if (r.ok) toast.success("任务已创建");
                    else toast.error(r.error);
                  }
                  closeForm();
                });
              }}
            >
              {pending
                ? isEdit
                  ? "保存中…"
                  : "创建中…"
                : isEdit
                  ? "保存修改"
                  : "创建任务"}
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
            <label className={styles.formLabel}>任务名称</label>
            <input
              type="text"
              name="name"
              className={styles.formInput}
              placeholder="例如:刷牙打卡"
              defaultValue={editingTask?.name ?? ""}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>任务图标</label>
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
              <label className={styles.formLabel}>积分</label>
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
              <label className={styles.formLabel}>执行周期</label>
              <select
                name="cycle"
                className={styles.formInput}
                defaultValue={editingTask?.cycle ?? "daily"}
              >
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="once">一次性</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>指派孩子</label>
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
        </form>
      </Modal>

      <Modal
        open={closeTaskId !== null}
        onClose={() => setCloseTaskId(null)}
        title="关闭任务"
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => setCloseTaskId(null)}
            >
              取消
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              disabled={pending || !closeTaskId}
              onClick={() => {
                if (!closeTaskId) return;
                const reason =
                  (document.getElementById("close-reason-select") as HTMLSelectElement | null)
                    ?.value ?? "暂时不需要";
                const fd = new FormData();
                fd.set("taskId", String(closeTaskId));
                fd.set("reason", reason);
                startTransition(async () => {
                  const r = await closeTaskAction(fd);
                  setCloseTaskId(null);
                  if (r.ok) toast.success("任务已关闭");
                  else toast.error(r.error);
                });
              }}
            >
              {pending ? "处理中…" : "确认关闭"}
            </button>
          </>
        }
      >
        <p className={styles.formHint}>
          关闭后任务不再对孩子展示,历史记录保留。可随时恢复启用。
        </p>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>关闭原因</label>
          <select id="close-reason-select" className={styles.formInput} defaultValue="暂时不需要">
            <option>暂时不需要</option>
            <option>孩子已掌握</option>
            <option>重复任务</option>
            <option>其他原因</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
