import { getTranslations } from "next-intl/server";
import { ClipboardList, Star, Music } from "lucide-react";
import styles from "@/app/landing.module.css";

export async function FeaturesGrid() {
  const t = await getTranslations("landing.features");

  const FEATURES = [
    { icon: ClipboardList, title: t("task.title"), desc: t("task.desc") },
    { icon: Star, title: t("points.title"), desc: t("points.desc") },
    { icon: Music, title: t("wish.title"), desc: t("wish.desc") },
  ];

  return (
    <section className={styles.features} id="features">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t("sectionTitle")}</h2>
        <p className={styles.sectionSub}>{t("sectionSubtitle")}</p>
      </div>
      <div className={styles.featuresGrid}>
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureCardHeader}>
                <div className={styles.featureIcon}>
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <h3 className={styles.featureCardTitle}>{f.title}</h3>
              </div>
              <p className={styles.featureCardDesc}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
