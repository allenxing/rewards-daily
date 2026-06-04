import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerId } from "./helpers";
import type { Database } from "@/lib/database.types";
import type { Wish, ChildWish, RedeemHistory } from "@/lib/ui-types";

type _WishRow = Database["public"]["Tables"]["wishes"]["Row"];
type _ChildRow = Database["public"]["Tables"]["children"]["Row"];
type _RecordRow = Database["public"]["Tables"]["points_records"]["Row"];

function formatYMD(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日兑换`;
}

function familyGradient(name: string): string | undefined {
  const palette = [
    "linear-gradient(135deg,#FEF3C7,#FDE68A)",
    "linear-gradient(135deg,#D1FAE5,#A7F3D0)",
    "linear-gradient(135deg,#FCE7F3,#FBCFE8)",
    "linear-gradient(135deg,#DBEAFE,#BAE6FD)",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export type WishWithProgress = {
  id: number;
  name: string;
  image: string;
  targetPoints: number;
  childId: number | null;
  childName: string;
  childTotalPoints: number;
  progressPercent: number;
  isLock: boolean;
  isFinish: boolean;
  isFamily: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getWishesForAdmin = cache(async (): Promise<WishWithProgress[]> => {
  const supabase = await createClient();
  const ownerId = await getOwnerId();
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from("wishes")
    .select("id, name, image_url, emoji, target_points, child_id, is_family, is_lock, is_finish, created_at, updated_at, children!left(name, total_points)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const join = r as unknown as { children: { name: string; total_points: number }[] | null };
    const child = join.children?.[0] ?? null;
    const target = r.target_points;
    const current = child?.total_points ?? 0;
    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      id: r.id,
      name: r.name,
      image: r.emoji ?? r.image_url ?? "🎁",
      targetPoints: target,
      childId: r.child_id,
      childName: r.is_family ? "全家" : child?.name ?? "",
      childTotalPoints: current,
      progressPercent: progress,
      isLock: r.is_lock,
      isFinish: r.is_finish,
      isFamily: r.is_family,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
});

export const getWishesForChild = cache(async (
  shareToken: string
): Promise<ChildWish[]> => {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id, name, total_points")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return [];
  const { data, error } = await supabase
    .from("wishes")
    .select("id, name, emoji, target_points, is_finish, is_lock")
    .eq("child_id", child.id)
    .eq("is_finish", false);
  if (error) throw error;
  const colors: ChildWish["color"][] = ["coral", "lavender", "mint", "grass"];
  return (data ?? []).map((r, i) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji ?? "🎁",
    cost: r.target_points,
    current: Math.min(r.target_points, child.total_points),
    color: colors[i % colors.length] ?? "coral",
    ownerId: child.id,
  }));
});

export const getRedeemHistoryForChild = cache(async (
  shareToken: string
): Promise<RedeemHistory[]> => {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return [];
  const { data, error } = await supabase
    .from("points_records")
    .select("id, points, remark, create_time, related_id")
    .eq("child_id", child.id)
    .eq("record_type", "wish")
    .order("create_time", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: (r.remark ?? "兑换").replace(/^兑换:/, ""),
    emoji: "🎁",
    date: formatYMD(r.create_time),
    cost: Math.abs(r.points),
    iconBg: "rgba(255,217,61,0.15)",
    childId: child.id,
  }));
});

export function toAdminWish(w: WishWithProgress): Wish {
  return {
    id: w.id,
    name: w.name,
    image: w.image,
    points: w.targetPoints,
    owner: w.isFamily ? "家庭" : w.childName,
    isFamily: w.isFamily,
    progress: Math.min(w.targetPoints, w.childTotalPoints),
    gradient: w.isFamily ? familyGradient(w.name) : undefined,
    locked: w.isLock,
    finished: w.isFinish,
  };
}
