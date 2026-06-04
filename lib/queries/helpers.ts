import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getOwnerId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
});
