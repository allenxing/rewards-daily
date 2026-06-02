"use client";

import { useState, useMemo } from "react";
import { Download, BarChart3 } from "lucide-react";
import { records, recordSummary, children } from "@/lib/mock-data";
import type { Record as PointsRecord, Child } from "@/lib/mock-data";
import styles from "@/app/admin/admin.module.css";

type Props = {
  initialRecords: PointsRecord[];
  kidsList: Child[];
};

const typeLabel: Record<string, string> = {
  earn: "earn",
  deduct: "deduct",
  manual: "manual",
  wish: "wish",
};

export function RecordsClient({ initialRecords, kidsList }: Props) {
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return initialRecords.filter((r) => {
      if (childFilter !== "all" && r.childId !== childFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      return true;
    });
  }, [initialRecords, childFilter, typeFilter]);

  const reset = () => {
    setChildFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>积分流水记录</h1>
        <div className={styles.pageActions}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
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
            +{recordSummary.monthEarn}
          </span>
        </div>
        <div className={styles.summaryChip}>
          <span className={`${styles.summaryDot} ${styles.summaryDotRed}`} />
          <span>本月扣除</span>
          <span className={`${styles.summaryMono} ${styles.summaryDeduct}`}>
            -{recordSummary.monthDeduct}
          </span>
        </div>
        <div className={styles.summaryChip}>
          <span>净增</span>
          <span className={styles.summaryMono}>+{recordSummary.netAdd}</span>
        </div>
      </div>

      <div className={styles.filterBar}>
        <select
          className={styles.filterBarSelect}
          value={childFilter}
          onChange={(e) => setChildFilter(e.target.value)}
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className={`${styles.filterBarInput} ${styles.filterBarDate}`}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
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
            <BarChart3 size={48} strokeWidth={1.5} />
          </div>
          <div className={styles.emptyStateText}>暂无匹配的流水记录</div>
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

void children;
void records;
