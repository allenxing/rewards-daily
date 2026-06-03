"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { FloatingActions } from "./floating-actions";
import type { Child } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

export function AdminShell({
  kids,
  userEmail,
  children: pageContent,
}: {
  kids: Child[];
  userEmail: string;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const scrollPos = useRef(0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      scrollPos.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPos.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollPos.current);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      {sidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        userEmail={userEmail}
        open={sidebarOpen}
        closeButton={
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={2} />
          </button>
        }
      />

      <div className={styles.shell}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>

        <main className={styles.main}>
          {pageContent}
        </main>
      </div>

      <FloatingActions kidsList={kids} />
    </>
  );
}
