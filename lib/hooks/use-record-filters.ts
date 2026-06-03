// Stub: real implementation in Phase 6 task 6.4
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { RecordFilters } from "@/lib/queries/points-records";

export function useRecordFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const filters = useMemo<RecordFilters>(() => {
    const f: RecordFilters = {};
    const c = sp.get("childId");
    if (c) f.childId = Number(c);
    const t = sp.get("type");
    if (t) f.type = t as RecordFilters["type"];
    const df = sp.get("dateFrom");
    if (df) f.dateFrom = df;
    const dt = sp.get("dateTo");
    if (dt) f.dateTo = dt;
    return f;
  }, [sp]);
  const setFilter = useCallback(
    (patch: Partial<RecordFilters>) => {
      const p = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") p.delete(k);
        else p.set(k, String(v));
      });
      router.push(`/admin/records?${p.toString()}`);
    },
    [sp, router]
  );
  return { filters, setFilter };
}
