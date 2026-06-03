import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = supabase.storage.from("avatar").getPublicUrl(path);
  return data.publicUrl;
}
