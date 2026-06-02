import { Cloud, Smartphone, Shield, Zap } from "lucide-react";
import styles from "@/app/landing.module.css";

const ADVANTAGES = [
  {
    icon: Cloud,
    title: "云端存储",
    desc: "基于 Supabase 云端持久化,数据安全备份,永不丢失。",
  },
  {
    icon: Smartphone,
    title: "多设备同步",
    desc: "手机、平板、电脑随时随地访问,数据实时同步。",
  },
  {
    icon: Shield,
    title: "权限隔离",
    desc: "家长管理端与孩子端严格分离,数据完全隔离、安全可靠。",
  },
  {
    icon: Zap,
    title: "轻量即用",
    desc: "无需自建后端,开箱即用,零技术门槛快速上手。",
  },
];

export function AdvantagesGrid() {
  return (
    <section className={styles.advantages}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>产品优势</h2>
        <p className={styles.sectionSub}>轻量开箱即用,数据安全无忧</p>
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
