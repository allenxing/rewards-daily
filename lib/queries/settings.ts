import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Settings = {
  ownerId: string;
  adminPwd: string;
  securityQuestion: string | null;
  securityAnswer: string | null;
  globalTheme: string;
  soundOpen: boolean;
  compactMode: boolean;
  createdAt: string;
  updatedAt: string;
};

type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

function mapSettings(r: SettingsRow): Settings {
  return {
    ownerId: r.owner_id,
    adminPwd: r.admin_pwd,
    securityQuestion: r.security_question,
    securityAnswer: r.security_answer,
    globalTheme: r.global_theme,
    soundOpen: r.sound_open,
    compactMode: r.compact_mode,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettings(data) : null;
}
