import "server-only";
import { createClient } from "@/lib/supabase/server";
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

export async function getChildren(): Promise<Child[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapChild);
}

export async function getChildById(id: number): Promise<Child | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapChild(data) : null;
}

export async function getChildByShareToken(token: string): Promise<Child | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw error;
  return data ? mapChild(data) : null;
}
