import { getTranslations } from "next-intl/server";
import { Cloud, Smartphone, Shield, Zap } from "lucide-react";
import styles from "@/app/landing.module.css";

export async function AdvantagesGrid() {
  const t = await getTranslations("landing.advantages");

  const ADVANTAGES = [
    { icon: Cloud, title: t("cloud.title"), desc: t("cloud.desc") },
    { icon: Smartphone, title: t("sync.title"), desc: t("sync.desc") },
    { icon: Shield, title: t("permissions.title"), desc: t("permissions.desc") },
    { icon: Zap, title: t("lightweight.title"), desc: t("lightweight.desc") },
  ];

  return (
    <section className={styles.advantages}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t("sectionTitle")}</h2>
        <p className={styles.sectionSub}>{t("sectionSubtitle")}</p>
      </div>
      <div className={styles.advantagesGrid}>
        {ADVANTAGES.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.title} className={styles.advantageItem}>
              <div className={styles.advantageIcon}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h4 className={styles.advantageTitle}>{a.title}</h4>
                <p className={styles.advantageDesc}>{a.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
