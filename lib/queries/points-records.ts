// Stub: real implementation in Phase 2 task 2.6
export type RecordFilters = {
  childId?: number;
  type?: "earn" | "deduct" | "manual" | "wish" | "task";
  dateFrom?: string;
  dateTo?: string;
};

export type PointsRecord = {
  id: number;
  ownerId: string;
  childId: number;
  relatedId: number | null;
  recordType: string;
  points: number;
  remark: string | null;
  createTime: string;
};

export async function getRecords(_filters: RecordFilters): Promise<PointsRecord[]> {
  throw new Error("not implemented: getRecords (Phase 2)");
}

export async function getRecordSummary(
  _childId?: number,
  _monthFrom?: Date
): Promise<{ monthEarn: number; monthDeduct: number; netAdd: number }> {
  throw new Error("not implemented: getRecordSummary (Phase 2)");
}
