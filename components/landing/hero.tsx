"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { openAuthModal } from "./user-area";
import styles from "@/app/landing.module.css";

type Props = {
  isLoggedIn: boolean;
};

export function Hero({ isLoggedIn }: Props) {
  const t = useTranslations("landing.hero");
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>
        {t("titleLine1")}<span className={styles.heroTitleAccent}>{t("titleLine2")}</span>
      </h1>
      <p className={styles.heroSub}>{t("subtitle")}</p>
      <div className={styles.heroActions}>
        {isLoggedIn ? (
          <Link href="/admin" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Lock size={16} strokeWidth={2.5} />
            {t("ctaLoggedIn")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("signup")}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Lock size={16} strokeWidth={2.5} />
            {t("ctaNotLoggedIn")}
          </button>
        )}
        <a href="#features" className={`${styles.btn} ${styles.btnOutline}`}>
          {t("learnMore")}
        </a>
      </div>
    </section>
  );
}
