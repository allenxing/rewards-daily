"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Props = {
  checked?: boolean;
  name?: string;
  onChange?: (next: boolean) => void;
};

export function Toggle({ checked = false, name, onChange }: Props) {
  const [internal, setInternal] = useState(checked);
  const isControlled = onChange !== undefined;
  const on = isControlled ? checked : internal;
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={on}
        name={name}
        onChange={(e) => {
          if (isControlled) onChange(e.target.checked);
          else setInternal(e.target.checked);
        }}
      />
      <span className={styles.toggleTrack} />
      <span className={styles.toggleThumb} />
    </label>
  );
}
