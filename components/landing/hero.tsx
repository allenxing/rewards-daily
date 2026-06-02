"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { openAuthModal } from "./user-area";
import styles from "@/app/landing.module.css";

type Props = {
  isLoggedIn: boolean;
};

export function Hero({ isLoggedIn }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.badge}>★ 好习惯养成计划</div>
      <h1 className={styles.heroTitle}>
        让好习惯,<span className={styles.heroTitleAccent}>自然生长</span>
      </h1>
      <p className={styles.heroSub}>
        通过任务积分、愿望激励、勋章荣誉的闭环体系,帮助 3-6
        岁孩子在游戏化体验中养成良好习惯,家长全程守护、数据云端留存。
      </p>
      <div className={styles.heroActions}>
        {isLoggedIn ? (
          <Link href="/admin" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Lock size={16} strokeWidth={2.5} />
            进入管理后台
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("signup")}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Lock size={16} strokeWidth={2.5} />
            开始使用
          </button>
        )}
        <a href="#features" className={`${styles.btn} ${styles.btnOutline}`}>
          了解更多
        </a>
      </div>
    </section>
  );
}
