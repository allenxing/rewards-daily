import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { getSettings } from "@/lib/queries/settings";

export default async function SettingsPage() {
  const settings = await getSettings();
  if (!settings) redirect("/auth/login");
  return <SettingsClient initial={settings} />;
}
