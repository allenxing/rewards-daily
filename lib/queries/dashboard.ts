// Stub: real implementation in Phase 2 task 2.7
export type DashboardStats = {
  pendingReview: number;
  totalPoints: number;
  completedToday: number;
  pendingWishes: number;
};

export type ChildSummary = {
  childId: number;
  name: string;
  slug: string;
  totalPoints: number;
  level: number;
  themeColor: string;
  themeKey: string;
  activeTaskCount: number;
  pendingAuditCount: number;
  completedTodayCount: number;
};

export type WishProgress = {
  wishId: number;
  name: string;
  targetPoints: number;
  isLock: boolean;
  isFinish: boolean;
  childId: number;
  childName: string;
  totalPoints: number;
  progressPercent: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  throw new Error("not implemented: getDashboardStats (Phase 2)");
}

export async function getChildSummaries(): Promise<ChildSummary[]> {
  throw new Error("not implemented: getChildSummaries (Phase 2)");
}

export async function getWishProgress(_wishId: number): Promise<WishProgress> {
  throw new Error("not implemented: getWishProgress (Phase 2)");
}
