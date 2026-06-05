import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerId } from "./helpers";
import type { Database } from "@/lib/database.types";
import type { ReviewItem } from "@/lib/ui-types";

type _AuditRow = Database["public"]["Tables"]["task_audit"]["Row"];
type _TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type _ChildRow = Database["public"]["Tables"]["children"]["Row"];

function formatRelative(iso: string): string {
  const t = new Date(iso);
  const now = new Date();
  const sameDay =
    t.getFullYear() === now.getFullYear() &&
    t.getMonth() === now.getMonth() &&
    t.getDate() === now.getDate();
  if (sameDay) {
    return `今天 ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  const y = t.getFullYear();
  const m = t.getMonth() + 1;
  const d = t.getDate();
  return `${y}年${m}月${d}日`;
}

export type AuditWithJoins = {
  id: number;
  taskId: number;
  childId: number;
  auditStatus: string;
  submitTime: string;
  auditTime: string | null;
  refuseReason: string | null;
  taskName: string;
  taskPoints: number;
  childName: string;
  childThemeColor: string;
  childAvatarStyle: "smile" | "smile-plus";
};

export const getPendingAudits = cache(async (limit = 20): Promise<AuditWithJoins[]> => {
  const supabase = await createClient();
  const ownerId = await getOwnerId();
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from("task_audit")
    .select("id, task_id, child_id, audit_status, submit_time, audit_time, refuse_reason, tasks!inner(name, points), children!inner(name, theme_color, avatar_style)")
    .eq("owner_id", ownerId)
    .eq("audit_status", "pending")
    .order("submit_time", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as {
      tasks: { name: string; points: number } | { name: string; points: number }[];
      children: { name: string; theme_color: string; avatar_style: string } | { name: string; theme_color: string; avatar_style: string }[];
    };
    const child = Array.isArray(join.children) ? join.children[0] : join.children;
    const task = Array.isArray(join.tasks) ? join.tasks[0] : join.tasks;
    return {
      id: r.id,
      taskId: r.task_id,
      childId: r.child_id,
      auditStatus: r.audit_status,
      submitTime: r.submit_time,
      auditTime: r.audit_time,
      refuseReason: r.refuse_reason,
      taskName: task?.name ?? "",
      taskPoints: task?.points ?? 0,
      childName: child?.name ?? "",
      childThemeColor: child?.theme_color ?? "#E8D5C4",
      childAvatarStyle: child?.avatar_style === "smile-plus" ? "smile-plus" : "smile",
    };
  });
});

export const getAuditsForChild = cache(async (
  shareToken: string,
  filter?: "pending" | "done" | "all"
): Promise<AuditWithJoins[]> => {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return [];
  let q = supabase
    .from("task_audit")
    .select("id, task_id, child_id, audit_status, submit_time, audit_time, refuse_reason, tasks!inner(name, points), children!inner(name, theme_color, avatar_style)")
    .eq("child_id", child.id)
    .order("submit_time", { ascending: false });
  if (filter === "pending") q = q.eq("audit_status", "pending");
  if (filter === "done") q = q.eq("audit_status", "agree");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as {
      tasks: { name: string; points: number } | { name: string; points: number }[];
      children: { name: string; theme_color: string; avatar_style: string } | { name: string; theme_color: string; avatar_style: string }[];
    };
    const child = Array.isArray(join.children) ? join.children[0] : join.children;
    const task = Array.isArray(join.tasks) ? join.tasks[0] : join.tasks;
    return {
      id: r.id,
      taskId: r.task_id,
      childId: r.child_id,
      auditStatus: r.audit_status,
      submitTime: r.submit_time,
      auditTime: r.audit_time,
      refuseReason: r.refuse_reason,
      taskName: task?.name ?? "",
      taskPoints: task?.points ?? 0,
      childName: child?.name ?? "",
      childThemeColor: child?.theme_color ?? "#E8D5C4",
      childAvatarStyle: child?.avatar_style === "smile-plus" ? "smile-plus" : "smile",
    };
  });
});

export type TaskStatusResult = {
  status: "todo" | "pending" | "done";
  auditId?: number;
};

function getWindowStart(
  cycle: "daily" | "weekly" | "once",
  now: Date
): Date | null {
  if (cycle === "once") return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (cycle === "weekly") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
  }
  return start;
}

export function computeChildTaskStatuses(
  tasks: { id: number; cycle: "daily" | "weekly" | "once" }[],
  audits: AuditWithJoins[],
  now?: Date
): Map<number, TaskStatusResult> {
  const currentTime = now ?? new Date();
  const auditsByTask = new Map<number, AuditWithJoins[]>();
  for (const a of audits) {
    const list = auditsByTask.get(a.taskId) ?? [];
    list.push(a);
    auditsByTask.set(a.taskId, list);
  }

  const result = new Map<number, TaskStatusResult>();
  for (const task of tasks) {
    const taskAudits = auditsByTask.get(task.id) ?? [];
    const windowStart = getWindowStart(task.cycle, currentTime);
    const filtered = windowStart
      ? taskAudits.filter((a) => new Date(a.submitTime) >= windowStart)
      : taskAudits;

    if (filtered.length === 0) {
      result.set(task.id, { status: "todo" });
    } else {
      // filtered preserves submit_time desc order from query
      const latest = filtered[0];
      if (latest.auditStatus === "pending") {
        result.set(task.id, { status: "pending", auditId: latest.id });
      } else if (latest.auditStatus === "agree") {
        result.set(task.id, { status: "done", auditId: latest.id });
      } else {
        // refuse → todo, child can retry
        result.set(task.id, { status: "todo" });
      }
    }
  }
  return result;
}

export function toReviewItem(a: AuditWithJoins): ReviewItem {
  return {
    id: a.id,
    taskName: a.taskName,
    childName: a.childName,
    submitTime: formatRelative(a.submitTime),
    points: a.taskPoints,
    themeColor: a.childThemeColor,
    avatarStyle: a.childAvatarStyle,
  };
}
