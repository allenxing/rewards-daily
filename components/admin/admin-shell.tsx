"use client";

import { useState } from "react";
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

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.mobileMenuBtn}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} strokeWidth={2} />
      </button>

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

      <main className={`${styles.main} ${sidebarOpen ? styles.mainBlur : ""}`}>
        {pageContent}
      </main>
      <FloatingActions kidsList={kids} />
    </div>
  );
}
