import Link from "next/link";
import styles from "@/app/child/child.module.css";

export default function ChildNotFound() {
  return (
    <div className={styles.notFound}>
      <div className={styles.notFoundEmoji}>😢</div>
      <h1 className={styles.notFoundTitle}>找不到这个孩子</h1>
      <p className={styles.notFoundDesc}>请检查链接是否正确,或回到首页选择孩子</p>
      <Link href="/" className={styles.notFoundBtn}>
        🏠 回到首页
      </Link>
    </div>
  );
}
