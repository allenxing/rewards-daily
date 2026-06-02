"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";

export type ColorOption = {
  key?: string;
  color: string;
  gradient?: string;
  label?: string;
  selected?: boolean;
};

type Props = {
  options: ColorOption[];
  name?: string;
  defaultIndex?: number;
  value?: string;
  onChange?: (key: string, color: string) => void;
};

export function ColorPicker({ options, name, defaultIndex = 0, value, onChange }: Props) {
  const [internalSelected, setInternalSelected] = useState(defaultIndex);
  const selected =
    value !== undefined
      ? Math.max(0, options.findIndex((o) => o.key === value))
      : internalSelected;

  const handleClick = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    if (onChange) onChange(opt.key ?? opt.color, opt.gradient ?? opt.color);
    if (value === undefined) setInternalSelected(i);
  };

  return (
    <div className={styles.colorOptions}>
      {options.map((opt, i) => (
        <button
          type="button"
          key={opt.key ?? opt.color}
          className={`${styles.colorOption} ${i === selected ? styles.colorOptionSelected : ""}`}
          style={{ background: opt.gradient ?? opt.color }}
          title={opt.label}
          aria-label={opt.label ?? opt.color}
          onClick={() => handleClick(i)}
        />
      ))}
      {name && (
        <input
          type="hidden"
          name={name}
          value={options[selected]?.key ?? options[selected]?.color ?? ""}
        />
      )}
    </div>
  );
}
