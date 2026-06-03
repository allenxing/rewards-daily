import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { ReviewItem } from "@/lib/ui-types";

type _AuditRow = Database["public"]["Tables"]["task_audit"]["Row"];
type _TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type _ChildRow = Database["public"]["Tables"]["children"]["Row"];

const AVATAR_BG = ["#E8D5C4", "#D5E8D4", "#EDE9FE", "#FEF3C7", "#FEE2E2"];
const AVATAR_FG = ["#5D4432", "#2D7D46", "#5D2D7A", "#7C5A00", "#7A2020"];

function hashColor(seed: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

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
};

export async function getPendingAudits(limit = 20): Promise<AuditWithJoins[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("task_audit")
    .select("id, task_id, child_id, audit_status, submit_time, audit_time, refuse_reason, tasks!inner(name, points), children!inner(name)")
    .eq("owner_id", user.id)
    .eq("audit_status", "pending")
    .order("submit_time", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as {
      tasks: { name: string; points: number }[];
      children: { name: string }[];
    };
    return {
      id: r.id,
      taskId: r.task_id,
      childId: r.child_id,
      auditStatus: r.audit_status,
      submitTime: r.submit_time,
      auditTime: r.audit_time,
      refuseReason: r.refuse_reason,
      taskName: join.tasks?.[0]?.name ?? "",
      taskPoints: join.tasks?.[0]?.points ?? 0,
      childName: join.children?.[0]?.name ?? "",
    };
  });
}

export async function getAuditsForChild(
  shareToken: string,
  filter?: "pending" | "done" | "all"
): Promise<AuditWithJoins[]> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return [];
  let q = supabase
    .from("task_audit")
    .select("id, task_id, child_id, audit_status, submit_time, audit_time, refuse_reason, tasks!inner(name, points), children!inner(name)")
    .eq("child_id", child.id)
    .order("submit_time", { ascending: false });
  if (filter === "pending") q = q.eq("audit_status", "pending");
  if (filter === "done") q = q.eq("audit_status", "agree");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as {
      tasks: { name: string; points: number }[];
      children: { name: string }[];
    };
    return {
      id: r.id,
      taskId: r.task_id,
      childId: r.child_id,
      auditStatus: r.audit_status,
      submitTime: r.submit_time,
      auditTime: r.audit_time,
      refuseReason: r.refuse_reason,
      taskName: join.tasks?.[0]?.name ?? "",
      taskPoints: join.tasks?.[0]?.points ?? 0,
      childName: join.children?.[0]?.name ?? "",
    };
  });
}

export function toReviewItem(a: AuditWithJoins): ReviewItem {
  return {
    id: a.id,
    taskName: a.taskName,
    childName: a.childName,
    submitTime: formatRelative(a.submitTime),
    points: a.taskPoints,
    avatarBg: hashColor(a.childName, AVATAR_BG),
    avatarFg: hashColor(a.childName, AVATAR_FG),
  };
}
