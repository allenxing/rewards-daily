import { getTranslations } from "next-intl/server";
import Link from "next/link";
import styles from "@/app/child/child.module.css";

export default async function ChildNotFound() {
  const t = await getTranslations("child.notFound");
  return (
    <div className={styles.notFound}>
      <div className={styles.notFoundEmoji}>😢</div>
      <h1 className={styles.notFoundTitle}>{t("title")}</h1>
      <p className={styles.notFoundDesc}>{t("desc")}</p>
      <Link href="/" className={styles.notFoundBtn}>
        {t("backHome")}
      </Link>
    </div>
  );
}
