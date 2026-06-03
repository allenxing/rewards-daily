import { getTranslations } from "next-intl/server";
import styles from "@/app/landing.module.css";

export async function Footer() {
  const t = await getTranslations("landing.footer");
  return (
    <footer className={styles.footer}>
      <p className={styles.footerText}>
        {t("text")}
        <br />
        {t("subtext")}
      </p>
    </footer>
  );
}
