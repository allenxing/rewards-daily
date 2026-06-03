"use client";

import { Languages } from "lucide-react";

export function LocaleToggle() {
  const switchToEn = () => {
    document.cookie = "NEXT_LOCALE=en;path=/;max-age=31536000";
    window.location.reload();
  };

  const switchToZh = () => {
    document.cookie = "NEXT_LOCALE=zh;path=/;max-age=31536000";
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1">
      <Languages size={14} strokeWidth={1.5} className="text-neutral-400" />
      <button
        type="button"
        onClick={switchToZh}
        className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        中
      </button>
      <span className="text-neutral-300 text-xs">/</span>
      <button
        type="button"
        onClick={switchToEn}
        className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        EN
      </button>
    </div>
  );
}
