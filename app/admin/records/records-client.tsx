"use client";

import { useMemo } from "react";
import { Download, Receipt } from "lucide-react";
import { useRecordFilters } from "@/lib/hooks/use-record-filters";
import type { PointsRecord, Child, RecordSummary } from "@/lib/ui-types";
import styles from "@/app/admin/admin.module.css";

type Props = {
  initialRecords: PointsRecord[];
  kidsList: Child[];
  summary: RecordSummary;
};

const typeLabel: Record<string, string> = {
  earn: "earn",
  deduct: "deduct",
  manual: "manual",
  wish: "wish",
};

export function RecordsClient({ initialRecords, kidsList, summary }: Props) {
  const { filters, setFilter } = useRecordFilters();

  const filtered = useMemo(() => {
    return initialRecords.filter((r) => {
      if (filters.childId !== undefined && r.childId !== filters.childId) return false;
      if (filters.type && r.type !== filters.type) return false;
      return true;
    });
  }, [initialRecords, filters.childId, filters.type]);

  const reset = () => {
    setFilter({ childId: undefined, type: undefined, dateFrom: undefined, dateTo: undefined });
  };

  const handleExport = () => {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `records-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>积分流水记录</h1>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={handleExport}
          >
            <Download size={14} strokeWidth={2} />
            导出数据
          </button>
        </div>
      </div>

      <div className={styles.summaryBar}>
        <div className={styles.summaryChip}>
          <span className={`${styles.summaryDot} ${styles.summaryDotGreen}`} />
          <span>本月获得</span>
          <span className={`${styles.summaryMono} ${styles.summaryEarn}`}>
            +{summary.monthEarn}
          </span>
        </div>
        <div className={styles.summaryChip}>
          <span className={`${styles.summaryDot} ${styles.summaryDotRed}`} />
          <span>本月扣除</span>
          <span className={`${styles.summaryMono} ${styles.summaryDeduct}`}>
            -{summary.monthDeduct}
          </span>
        </div>
        <div className={styles.summaryChip}>
          <span>净增</span>
          <span className={`${styles.summaryMono}`}>+{summary.netAdd}</span>
        </div>
      </div>

      <div className={styles.filterBar}>
        <select
          className={styles.filterBarSelect}
          value={filters.childId ?? "all"}
          onChange={(e) =>
            setFilter({ childId: e.target.value === "all" ? undefined : Number(e.target.value) })
          }
        >
          <option value="all">全部孩子</option>
          {kidsList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={styles.filterBarSelect}
          value={filters.type ?? "all"}
          onChange={(e) =>
            setFilter({ type: e.target.value === "all" ? undefined : (e.target.value as RecordFiltersType) })
          }
        >
          <option value="all">全部类型</option>
          <option value="earn">获得积分</option>
          <option value="deduct">扣除积分</option>
          <option value="manual">手动调整</option>
          <option value="wish">愿望兑换</option>
        </select>
        <input
          type="date"
          className={`${styles.filterBarInput} ${styles.filterBarDate}`}
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })}
        />
        <input
          type="date"
          className={`${styles.filterBarInput} ${styles.filterBarDate}`}
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilter({ dateTo: e.target.value || undefined })}
        />
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={reset}
        >
          重置
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Receipt size={48} strokeWidth={1.5} />
          </div>
          <div className={styles.emptyStateText}>暂无流水记录</div>
        </div>
      ) : (
        filtered.map((record) => {
          const isEarn = record.type === "earn" || record.type === "manual";
          return (
            <div key={record.id} className={styles.recordRow} data-type={typeLabel[record.type]}>
              <div className={styles.recordChild}>
                <div
                  className={styles.avatar}
                  style={{ background: record.childAvatarBg, color: record.childAvatarColor }}
                >
                  {record.childName.charAt(0)}
                </div>
                <span className={styles.recordChildName}>{record.childName}</span>
              </div>
              <div className={styles.recordSource}>
                <div className={styles.recordSourceTitle}>{record.title}</div>
                <div className={styles.recordSourceMeta}>{record.meta}</div>
              </div>
              <div
                className={`${styles.recordPoints} ${
                  isEarn ? styles.recordPointsEarn : styles.recordPointsDeduct
                }`}
              >
                {isEarn ? "+" : "-"}
                {record.points}
              </div>
              <div className={styles.recordTime}>{record.time}</div>
            </div>
          );
        })
      )}
    </div>
  );
}

type RecordFiltersType = "earn" | "deduct" | "manual" | "wish";
