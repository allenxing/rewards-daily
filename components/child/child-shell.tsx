import type { Child } from "@/lib/ui-types";
import { ChildHeader } from "./child-header";
import { ChildBottomNav } from "./bottom-nav";
import styles from "@/app/child/child.module.css";

type Props = {
  child: Child;
  shareToken?: string;
  children: React.ReactNode;
};

export function ChildShell({ child, shareToken, children }: Props) {
  const themeClass = styles[`theme${capitalize(child.themeKey)}` as keyof typeof styles] as
    | string
    | undefined;

  return (
    <div className={`${styles.root} ${themeClass ?? ""}`}>
      <div className={styles.stars} aria-hidden="true" />
      <ChildHeader
        childId={child.id}
        shareToken={shareToken}
        name={child.name}
        totalPoints={child.totalPoints}
        avatarBg={child.avatarBg}
        avatarColor={child.avatarColor}
        avatarUrl={child.avatarUrl}
      />
      <main>{children}</main>
      <ChildBottomNav childId={child.id} shareToken={shareToken ?? child.shareToken} />
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
