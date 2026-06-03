"use client";

import { useEffect, useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-1">家长验证</h2>
        <p className="text-sm text-gray-500 mb-6">请输入4位数字密码</p>

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
          className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border-2 rounded-xl outline-none mb-4"
          style={{
            borderColor: error ? "#ef4444" : "#e5e7eb",
            fontFamily: "'Nunito', monospace",
          }}
          autoFocus
        />

        {error && (
          <p className="text-red-500 text-sm mb-4">密码错误</p>
        )}

        <button
          type="button"
          disabled={password.length !== 4 || pending}
          className="w-full py-3 rounded-xl font-bold text-white text-base transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          onClick={handleVerify}
        >
          {pending ? "验证中…" : "验证"}
        </button>
      </div>
    </div>
  );
}
