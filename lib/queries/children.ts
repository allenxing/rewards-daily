import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerId } from "./helpers";
import type { Database } from "@/lib/database.types";
import type { Child } from "@/lib/ui-types";

type ChildRow = Database["public"]["Tables"]["children"]["Row"];

function mapChild(r: ChildRow): Child {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    themeKey: r.theme_key,
    themeColor: r.theme_color,
    totalPoints: r.total_points,
    level: r.level,
    avatarStyle: (r.avatar_style === "smile-plus" ? "smile-plus" : "smile"),
    shareToken: r.share_token,
  };
}

export const getChildren = cache(async (): Promise<Child[]> => {
  const supabase = await createClient();
  const ownerId = await getOwnerId();
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from("children")
    .select("id, name, slug, theme_key, theme_color, total_points, level, avatar_style, share_token")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapChild(r as ChildRow));
});

export const getChildById = cache(async (id: number): Promise<Child | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select("id, name, slug, theme_key, theme_color, total_points, level, avatar_style, share_token")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapChild(data as ChildRow) : null;
});

export const getChildByShareToken = cache(async (token: string): Promise<Child | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select("id, name, slug, theme_key, theme_color, total_points, level, avatar_style, share_token")
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw error;
  return data ? mapChild(data as ChildRow) : null;
});
