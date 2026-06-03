import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { Child } from "@/lib/ui-types";

type ChildRow = Database["public"]["Tables"]["children"]["Row"];

const DEFAULT_AVATAR_BG = "#E8D5C4";
const DEFAULT_AVATAR_FG = "#5D4432";

function mapChild(r: ChildRow): Child {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    themeKey: r.theme_key,
    themeColor: r.theme_color,
    totalPoints: r.total_points,
    level: r.level,
    avatarUrl: r.avatar_url,
    avatarBg: r.avatar_url ? "transparent" : r.theme_color || DEFAULT_AVATAR_BG,
    avatarColor: DEFAULT_AVATAR_FG,
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
