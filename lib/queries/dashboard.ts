import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type DashboardStats = {
  pendingReview: number;
  totalPoints: number;
  completedToday: number;
  pendingWishes: number;
};

export type ChildSummary = {
  childId: number;
  name: string;
  slug: string;
  totalPoints: number;
  level: number;
  themeColor: string;
  themeKey: string;
  activeTaskCount: number;
  pendingAuditCount: number;
  completedTodayCount: number;
};

type VChildSummary = Database["public"]["Views"]["v_child_summary"]["Row"];
type VDashboardStats = Database["public"]["Views"]["v_dashboard_stats"]["Row"];

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { pendingReview: 0, totalPoints: 0, completedToday: 0, pendingWishes: 0 };
  }
  const { data, error } = await supabase
    .from("v_dashboard_stats")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  const d = (data as VDashboardStats | null) ?? null;
  return {
    pendingReview: d?.pending_review ?? 0,
    totalPoints: d?.total_points ?? 0,
    completedToday: d?.completed_today ?? 0,
    pendingWishes: d?.pending_wishes ?? 0,
  };
}

export async function getChildSummaries(): Promise<ChildSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_child_summary")
    .select("*")
    .order("total_points", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const v = r as VChildSummary;
    return {
      childId: v.child_id ?? 0,
      name: v.name ?? "",
      slug: v.slug ?? "",
      totalPoints: v.total_points ?? 0,
      level: v.level ?? 1,
      themeColor: v.theme_color ?? "#7DD3FC",
      themeKey: v.theme_key ?? "sky",
      activeTaskCount: v.active_task_count ?? 0,
      pendingAuditCount: v.pending_audit_count ?? 0,
      completedTodayCount: v.completed_today_count ?? 0,
    };
  });
}
