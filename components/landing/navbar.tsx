import { createClient } from "@/lib/supabase/server";
import { NavbarBrand, UserArea } from "./user-area";
import styles from "@/app/landing.module.css";

export async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  return (
    <nav className={styles.navbar}>
      <NavbarBrand />
      <UserArea email={email} />
    </nav>
  );
}
