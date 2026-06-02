import { ClipboardList, Star, Music, Trophy } from "lucide-react";
import styles from "@/app/landing.module.css";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "任务养成",
    desc: "自定义每日任务,设定执行周期与积分奖励,支持图片佐证提交,让好习惯可视化、可追踪。",
  },
  {
    icon: Star,
    title: "积分激励",
    desc: "完成任务即获积分,家长可手动奖惩,实时流水记录,让孩子清晰看到自己的成长轨迹。",
  },
  {
    icon: Music,
    title: "愿望奖励",
    desc: "孩子设定心愿目标,用积累的积分兑换梦想奖励,培养延迟满足与目标管理能力。",
  },
  {
    icon: Trophy,
    title: "勋章荣誉",
    desc: "达成里程碑解锁专属勋章,建立成就感与自信心,让每一次进步都值得被铭记。",
  },
];

export function FeaturesGrid() {
  return (
    <section className={styles.features} id="features">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>四大核心能力</h2>
        <p className={styles.sectionSub}>
          任务养成、积分激励、愿望奖励、勋章荣誉,构建完整的习惯养成闭环
        </p>
      </div>
      <div className={styles.featuresGrid}>
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Icon size={24} strokeWidth={1.8} />
              </div>
              <h3 className={styles.featureCardTitle}>{f.title}</h3>
              <p className={styles.featureCardDesc}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
