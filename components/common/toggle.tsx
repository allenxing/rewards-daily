"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Props = {
  checked?: boolean;
  name?: string;
};

export function Toggle({ checked = false, name }: Props) {
  const [on, setOn] = useState(checked);
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={on}
        name={name}
        onChange={(e) => setOn(e.target.checked)}
      />
      <span className={styles.toggleTrack} />
      <span className={styles.toggleThumb} />
    </label>
  );
}
