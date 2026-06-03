import "server-only";
import { createClient } from "@/lib/supabase/server";
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

const AVATAR_BG = ["#E8D5C4", "#D5E8D4", "#EDE9FE", "#FEF3C7", "#FEE2E2"];
const AVATAR_FG = ["#5D4432", "#2D7D46", "#5D2D7A", "#7C5A00", "#7A2020"];

function hashColor(seed: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
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

export async function getRecords(filters: RecordFilters): Promise<PointsRecord[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from("points_records")
    .select("id, child_id, record_type, points, remark, create_time, children!inner(name)")
    .eq("owner_id", user.id)
    .order("create_time", { ascending: false })
    .limit(200);
  if (filters.childId !== undefined) q = q.eq("child_id", filters.childId);
  if (filters.type) q = q.eq("record_type", filters.type);
  if (filters.dateFrom) q = q.gte("create_time", filters.dateFrom);
  if (filters.dateTo) q = q.lte("create_time", `${filters.dateTo}T23:59:59Z`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as { children: { name: string }[] };
    const childName = join.children?.[0]?.name ?? "";
    const dbType = r.record_type;
    const uiType: PointsRecord["type"] =
      dbType === "task" ? "earn" : (dbType as PointsRecord["type"]) ?? "earn";
    return {
      id: r.id,
      childId: r.child_id,
      childName,
      childAvatarBg: hashColor(childName, AVATAR_BG),
      childAvatarColor: hashColor(childName, AVATAR_FG),
      title: r.remark && r.remark.trim() ? r.remark : TYPE_TITLE[uiType] ?? "积分变动",
      meta: TYPE_META[uiType] ?? "",
      type: uiType,
      points: Math.abs(r.points),
      time: formatTime(r.create_time),
    };
  });
}

export async function getRecordSummary(): Promise<RecordSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { monthEarn: 0, monthDeduct: 0, netAdd: 0 };
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("points_records")
    .select("points, record_type")
    .eq("owner_id", user.id)
    .gte("create_time", start.toISOString());
  if (error) throw error;
  let monthEarn = 0;
  let monthDeduct = 0;
  for (const r of data ?? []) {
    if (r.points > 0) monthEarn += r.points;
    else monthDeduct += -r.points;
  }
  return { monthEarn, monthDeduct, netAdd: monthEarn - monthDeduct };
}
