import { SettingsClient } from "./settings-client";
import { getSettings } from "@/lib/queries/settings";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient initial={settings} />;
}
