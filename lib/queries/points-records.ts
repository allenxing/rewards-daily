import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerId } from "./helpers";
import type { Database } from "@/lib/database.types";
import type { PointsRecord, RecordSummary } from "@/lib/ui-types";

type _RecordRow = Database["public"]["Tables"]["points_records"]["Row"];

export type RecordFilters = {
  childId?: number;
  type?: "earn" | "deduct" | "manual" | "wish" | "task";
  dateFrom?: string;
  dateTo?: string;
};

function formatTime(iso: string): string {
  const t = new Date(iso);
  const now = new Date();
  const sameDay =
    t.getFullYear() === now.getFullYear() &&
    t.getMonth() === now.getMonth() &&
    t.getDate() === now.getDate();
  if (sameDay) {
    return `今天 ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  const diff = now.getTime() - t.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < 2 * oneDay) return `昨天 ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  if (diff < 3 * oneDay) return `前天 ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

const TYPE_META: Record<string, string> = {
  earn: "任务完成 · 自动审核",
  manual: "手动加分 · 家长操作",
  deduct: "手动扣分 · 家长操作",
  wish: "愿望兑换 · 梦想宝库",
  task: "任务奖励",
};

const TYPE_TITLE: Record<string, string> = {
  earn: "任务完成",
  manual: "手动调整",
  deduct: "手动扣分",
  wish: "愿望兑换",
  task: "任务奖励",
};

export const getRecords = cache(async (filters: RecordFilters): Promise<PointsRecord[]> => {
  const supabase = await createClient();
  const ownerId = await getOwnerId();
  if (!ownerId) return [];
  let q = supabase
    .from("points_records")
    .select("id, child_id, record_type, points, remark, create_time, children!inner(name, theme_color, avatar_style)")
    .eq("owner_id", ownerId)
    .order("create_time", { ascending: false })
    .limit(200);
  if (filters.childId !== undefined) q = q.eq("child_id", filters.childId);
  if (filters.type) q = q.eq("record_type", filters.type);
  if (filters.dateFrom) q = q.gte("create_time", filters.dateFrom);
  if (filters.dateTo) q = q.lte("create_time", `${filters.dateTo}T23:59:59Z`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as { children: { name: string; theme_color: string; avatar_style: string } | { name: string; theme_color: string; avatar_style: string }[] };
    const child = Array.isArray(join.children) ? join.children[0] : join.children;
    const childName = child?.name ?? "";
    const childTheme = child?.theme_color ?? "#E8D5C4";
    const childStyle = child?.avatar_style === "smile-plus" ? "smile-plus" : "smile";
    const dbType = r.record_type;
    const uiType: PointsRecord["type"] =
      dbType === "task" ? "earn" : (dbType as PointsRecord["type"]) ?? "earn";
    return {
      id: r.id,
      childId: r.child_id,
      childName,
      themeColor: childTheme,
      avatarStyle: childStyle,
      title: r.remark && r.remark.trim() ? r.remark : TYPE_TITLE[uiType] ?? "积分变动",
      meta: TYPE_META[uiType] ?? "",
      type: uiType,
      points: Math.abs(r.points),
      time: formatTime(r.create_time),
    };
  });
});

export const getRecordsForChild = cache(async (
  shareToken: string
): Promise<{ id: number; points: number; remark: string; recordType: string }[]> => {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return [];
  const { data } = await supabase
    .from("points_records")
    .select("id, points, remark, record_type")
    .eq("child_id", child.id)
    .in("record_type", ["manual", "deduct"])
    .order("create_time", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => ({
    id: r.id,
    points: Math.abs(r.points),
    remark: r.remark ?? "",
    recordType: r.record_type,
  }));
});

export const getRecordSummary = cache(async (): Promise<RecordSummary> => {
  const supabase = await createClient();
  const ownerId = await getOwnerId();
  if (!ownerId) return { monthEarn: 0, monthDeduct: 0, netAdd: 0 };
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("points_records")
    .select("points, record_type")
    .eq("owner_id", ownerId)
    .gte("create_time", start.toISOString());
  if (error) throw error;
  let monthEarn = 0;
  let monthDeduct = 0;
  for (const r of data ?? []) {
    if (r.points > 0) monthEarn += r.points;
    else monthDeduct += -r.points;
  }
  return { monthEarn, monthDeduct, netAdd: monthEarn - monthDeduct };
});
