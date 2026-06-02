"use client";

import { useEffect, useRef } from "react";
import styles from "./confetti.module.css";

type Props = {
  trigger: number;
  duration?: number;
};

const COLORS = ["#FFD93D", "#FF6B6B", "#6BCB77", "#A78BFA", "#4ECDC4", "#FF9FF3"];

export function Confetti({ trigger, duration = 2000 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;
    const container = containerRef.current;
    const pieces = 40;
    const fragments: HTMLDivElement[] = [];

    for (let i = 0; i < pieces; i++) {
      const piece = document.createElement("div");
      piece.className = styles.piece;
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.top = "-10px";
      piece.style.background = COLORS[i % COLORS.length];
      const size = 6 + Math.random() * 8;
      piece.style.width = `${size}px`;
      piece.style.height = `${size}px`;
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      piece.style.animation = `${styles.fall} ${
        1.5 + Math.random() * 1.5
      }s ease-out ${Math.random() * 0.5}s forwards`;
      container.appendChild(piece);
      fragments.push(piece);
    }

    const timer = setTimeout(() => {
      fragments.forEach((p) => p.remove());
    }, duration + 1500);

    return () => {
      clearTimeout(timer);
      fragments.forEach((p) => p.remove());
    };
  }, [trigger, duration]);

  return <div ref={containerRef} className={styles.container} aria-hidden="true" />;
}
