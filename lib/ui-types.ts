// UI shape types — what client components consume.
// DB snake_case types live in lib/database.types.ts.
// Mapping happens inside lib/queries/*.

export type Child = {
  id: number;
  name: string;
  slug: string;
  themeKey: string;
  themeColor: string;
  totalPoints: number;
  level: number;
  avatarUrl: string | null;
  avatarBg: string;
  avatarColor: string;
  shareToken: string;
};

export type Task = {
  id: number;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  points: number;
  cycle: "daily" | "weekly" | "once";
  status: "active" | "closed";
  closedReason: string | null;
  assignedChildren: number[];
  assignedChildNames: string[];
};

export type ReviewItem = {
  id: number;
  taskName: string;
  childName: string;
  submitTime: string;
  points: number;
  avatarBg: string;
  avatarFg: string;
};

export type Wish = {
  id: number;
  name: string;
  image: string;
  points: number;
  owner: string;
  isFamily: boolean;
  progress: number;
  gradient?: string;
  locked?: boolean;
  finished?: boolean;
};

export type PointsRecord = {
  id: number;
  childId: number;
  childName: string;
  childAvatarBg: string;
  childAvatarColor: string;
  title: string;
  meta: string;
  type: "earn" | "deduct" | "manual" | "wish";
  points: number;
  time: string;
};

export type RecordSummary = {
  monthEarn: number;
  monthDeduct: number;
  netAdd: number;
};

export type ChildTask = {
  id: number;
  name: string;
  detail: string;
  icon: string;
  iconClass: string;
  points: number;
  status: "todo" | "pending" | "done";
  assignedChildIds: number[];
  auditId?: number;
};

export type ChildWish = {
  id: number;
  name: string;
  emoji: string;
  cost: number;
  current: number;
  color: "coral" | "lavender" | "mint" | "grass";
  ownerId: number;
};

export type RedeemHistory = {
  id: number;
  name: string;
  emoji: string;
  date: string;
  cost: number;
  iconBg: string;
  childId: number;
};
