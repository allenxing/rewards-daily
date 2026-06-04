import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerId } from "./helpers";
import type { Database } from "@/lib/database.types";
import type { Task } from "@/lib/ui-types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["task_assignments"]["Row"];

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
  childNames: Map<number, string>
): Task {
  const names = assignments
    .map((cid) => childNames.get(cid))
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

async function loadChildNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string
): Promise<Map<number, string>> {
  const { data } = await supabase
    .from("children")
    .select("id, name")
    .eq("owner_id", ownerId);
  return new Map((data ?? []).map((c) => [c.id, c.name]));
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

export const getTasksForAdmin = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const ownerId = await getOwnerId();
  if (!ownerId) return [];
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, name, icon, points, cycle, status, closed_reason")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const [assignments, childNames] = await Promise.all([
    loadAssignmentsFor(supabase, ownerId),
    loadChildNames(supabase, ownerId),
  ]);
  return (tasks ?? []).map((r) =>
    mapTask(r as TaskRow, assignments.get(r.id) ?? [], childNames)
  );
});

export const getTasksForChildByShareToken = cache(async (
  shareToken: string
): Promise<Task[]> => {
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
  const [{ data: tasks, error }, childNames] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, name, icon, points, cycle, status, closed_reason")
      .in("id", taskIds)
      .eq("status", true)
      .order("created_at", { ascending: false }),
    loadChildNames(supabase, child.owner_id),
  ]);
  if (error) throw error;
  return (tasks ?? []).map((r) =>
    mapTask(r as TaskRow, assignments?.map((a) => a.task_id) ?? [], childNames)
  );
});
