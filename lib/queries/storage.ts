import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getAvatarUrl = cache(async (path: string | null): Promise<string | null> => {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = supabase.storage.from("avatar").getPublicUrl(path);
  return data.publicUrl;
});
