import styles from "@/app/landing.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerText}>
        © 2026 成长星球 — 好习惯养成计划
        <br />
        基于 Supabase 云端架构 · 数据安全备份 · 多设备同步
      </p>
    </footer>
  );
}
