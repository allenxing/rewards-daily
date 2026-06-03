import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Settings = {
  ownerId: string;
  adminPwd: string;
  globalTheme: string;
  soundOpen: boolean;
  compactMode: boolean;
  childAccessPwdEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

function mapSettings(r: SettingsRow): Settings {
  return {
    ownerId: r.owner_id,
    adminPwd: r.admin_pwd,
    globalTheme: r.global_theme,
    soundOpen: r.sound_open,
    compactMode: r.compact_mode,
    childAccessPwdEnabled: r.child_access_pwd_enabled,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("LOGIN_REQUIRED");
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapSettings(data);

  const { data: created, error: insertError } = await supabase
    .from("settings")
    .insert({
      owner_id: user.id,
      admin_pwd: "",
      global_theme: "sky",
      sound_open: true,
      compact_mode: false,
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return mapSettings(created);
}
