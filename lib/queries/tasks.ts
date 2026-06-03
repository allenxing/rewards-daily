import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { Task } from "@/lib/ui-types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["task_assignments"]["Row"];
type ChildRow = Database["public"]["Tables"]["children"]["Row"];

const ICON_BG_PALETTE = [
  "#DBEAFE",
  "#EDE9FE",
  "#D1FAE5",
  "#FEF3C7",
  "#FEE2E2",
  "#FCE7F3",
  "#E0F2FE",
  "#DCFCE7",
];
const ICON_FG_PALETTE = [
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#0284C7",
  "#16A34A",
];

function hashColor(seed: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function mapTask(
  r: TaskRow,
  assignments: number[],
  childrenById: Map<number, ChildRow>
): Task {
  const names = assignments
    .map((cid) => childrenById.get(cid)?.name)
    .filter((n): n is string => Boolean(n));
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    iconBg: hashColor(r.icon, ICON_BG_PALETTE),
    iconColor: hashColor(r.icon, ICON_FG_PALETTE),
    points: r.points,
    cycle: (r.cycle as Task["cycle"]) ?? "daily",
    status: r.status ? "active" : "closed",
    closedReason: r.closed_reason,
    assignedChildren: assignments,
    assignedChildNames: names,
  };
}

async function loadChildrenByOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string
): Promise<Map<number, ChildRow>> {
  const { data } = await supabase
    .from("children")
    .select("*")
    .eq("owner_id", ownerId);
  return new Map((data ?? []).map((c) => [c.id, c]));
}

async function loadAssignmentsFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string
): Promise<Map<number, number[]>> {
  const { data } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("owner_id", ownerId);
  const m = new Map<number, number[]>();
  for (const a of (data ?? []) as AssignmentRow[]) {
    const arr = m.get(a.task_id) ?? [];
    arr.push(a.child_id);
    m.set(a.task_id, arr);
  }
  return m;
}

export async function getTasksForAdmin(): Promise<Task[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const [assignments, childrenMap] = await Promise.all([
    loadAssignmentsFor(supabase, user.id),
    loadChildrenByOwner(supabase, user.id),
  ]);
  return (tasks ?? []).map((r) =>
    mapTask(r, assignments.get(r.id) ?? [], childrenMap)
  );
}

export async function getTasksForChildByShareToken(
  shareToken: string
): Promise<Task[]> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id, owner_id")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return [];
  const { data: assignments } = await supabase
    .from("task_assignments")
    .select("task_id")
    .eq("child_id", child.id);
  const taskIds = (assignments ?? []).map((a) => a.task_id);
  if (taskIds.length === 0) return [];
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .in("id", taskIds)
    .eq("status", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const childrenMap = await loadChildrenByOwner(supabase, child.owner_id);
  return (tasks ?? []).map((r) =>
    mapTask(r, assignments?.map((a) => a.task_id) ?? [], childrenMap)
  );
}
