"use client";

import { useEffect, useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./child-gate.module.css";

type Props = {
  childId: number;
  children: React.ReactNode;
};

function childAccessGranted(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem("child_access_granted") === "1";
}

function markGranted() {
  try {
    sessionStorage.setItem("child_access_granted", "1");
  } catch {}
}

export function ChildGate({ childId, children }: Props) {
  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (childAccessGranted()) {
      setChecking(false);
      setEnabled(true);
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("check_child_access_enabled", { p_child_id: childId })
      .then(({ data }) => {
        setEnabled(data ?? false);
        setChecking(false);
      });
  }, [childId]);

  const handleVerify = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { data: child } = await supabase
        .from("children")
        .select("owner_id")
        .eq("id", childId)
        .single();

      if (!child) {
        setError(true);
        return;
      }

      const { data: ok } = await supabase.rpc("verify_child_password", {
        p_owner_id: child.owner_id,
        p_password: password,
      });

      if (ok) {
        markGranted();
        setEnabled(true);
      } else {
        setError(true);
      }
    });
  };

  if (checking) {
    return <div className="min-h-screen" />;
  }

  if (enabled && childAccessGranted()) {
    return <>{children}</>;
  }

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Lock size={28} />
        </div>
        <h2 className={styles.title}>家长验证</h2>
        <p className={styles.sub}>请输入4位数字密码</p>

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && password.length === 4) handleVerify();
          }}
          className={`${styles.input} ${error ? styles.inputError : ""}`}
          autoFocus
        />

        {error && (
          <p className={styles.error}>密码错误</p>
        )}

        <button
          type="button"
          disabled={password.length !== 4 || pending}
          className={styles.btn}
          onClick={handleVerify}
        >
          {pending ? "验证中…" : "验证"}
        </button>
      </div>
    </div>
  );
}
