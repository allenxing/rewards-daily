export const dashboardStats = {
  pendingReview: 3,
  totalPoints: 1280,
  completedToday: 5,
  pendingWishes: 2,
} as const;

export type ReviewItem = {
  id: string;
  taskName: string;
  childName: string;
  submitTime: string;
  points: number;
  avatarBg: string;
  avatarFg: string;
};

export const dashboardReviews: ReviewItem[] = [
  {
    id: "1",
    taskName: "刷牙打卡",
    childName: "小明",
    submitTime: "今天 08:30",
    points: 5,
    avatarBg: "#E8D5C4",
    avatarFg: "#5D4432",
  },
  {
    id: "2",
    taskName: "亲子阅读15分钟",
    childName: "小红",
    submitTime: "今天 09:15",
    points: 10,
    avatarBg: "#D5E8D4",
    avatarFg: "#2D7D46",
  },
  {
    id: "3",
    taskName: "整理玩具",
    childName: "小明",
    submitTime: "今天 10:00",
    points: 5,
    avatarBg: "#E8D5C4",
    avatarFg: "#5D4432",
  },
];

export type Child = {
  id: string;
  name: string;
  slug: string;
  themeKey: "sky" | "coral" | "mint" | "lavender" | "sun";
  themeColor: string;
  totalPoints: number;
  level: number;
  avatarBg: string;
  avatarColor: string;
};

export const children: Child[] = [
  {
    id: "1",
    name: "小明",
    slug: "xiaoming",
    themeKey: "sky",
    themeColor: "#7DD3FC",
    totalPoints: 860,
    level: 5,
    avatarBg: "#E8D5C4",
    avatarColor: "#5D4432",
  },
  {
    id: "2",
    name: "小红",
    slug: "xiaohong",
    themeKey: "coral",
    themeColor: "#FCA5A5",
    totalPoints: 420,
    level: 3,
    avatarBg: "#D5E8D4",
    avatarColor: "#2D7D46",
  },
];

export type Task = {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  points: number;
  cycle: "daily" | "weekly" | "once";
  status: "active" | "closed";
  closedReason?: string;
  assignedChildren: string[];
};

export const tasks: Task[] = [
  {
    id: "1",
    name: "刷牙打卡",
    icon: "💧",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    points: 5,
    cycle: "daily",
    status: "active",
    assignedChildren: ["小明", "小红"],
  },
  {
    id: "2",
    name: "亲子阅读",
    icon: "📚",
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
    points: 10,
    cycle: "daily",
    status: "active",
    assignedChildren: ["小明", "小红"],
  },
  {
    id: "3",
    name: "户外运动",
    icon: "🎳",
    iconBg: "#D1FAE5",
    iconColor: "#059669",
    points: 15,
    cycle: "daily",
    status: "active",
    assignedChildren: ["小明"],
  },
  {
    id: "4",
    name: "整理玩具",
    icon: "🧹",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    points: 5,
    cycle: "daily",
    status: "active",
    assignedChildren: ["小明", "小红"],
  },
  {
    id: "5",
    name: "帮忙做家务",
    icon: "💌",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    points: 10,
    cycle: "weekly",
    status: "closed",
    closedReason: "暂时不需要",
    assignedChildren: ["小明"],
  },
];

export type Wish = {
  id: string;
  name: string;
  image: string;
  points: number;
  owner: string;
  isFamily: boolean;
  progress: number;
  gradient?: string;
  locked?: boolean;
};

export const wishes: Wish[] = [
  {
    id: "1",
    name: "画笔套装",
    image: "🎨",
    points: 50,
    owner: "小明",
    isFamily: false,
    progress: 36,
  },
  {
    id: "2",
    name: "恐龙模型",
    image: "🚀",
    points: 80,
    owner: "小明",
    isFamily: false,
    progress: 44,
  },
  {
    id: "3",
    name: "小吉他",
    image: "🎲",
    points: 100,
    owner: "小红",
    isFamily: false,
    progress: 40,
  },
  {
    id: "4",
    name: "游乐园一日游",
    image: "🌈",
    points: 200,
    owner: "家庭",
    isFamily: true,
    progress: 50,
    gradient: "linear-gradient(135deg,#FEF3C7,#FDE68A)",
  },
  {
    id: "5",
    name: "全家聚餐",
    image: "🍰",
    points: 150,
    owner: "家庭",
    isFamily: true,
    progress: 90,
    gradient: "linear-gradient(135deg,#D1FAE5,#A7F3D0)",
  },
];

export type Record = {
  id: string;
  childId: string;
  childName: string;
  childAvatarBg: string;
  childAvatarColor: string;
  title: string;
  meta: string;
  type: "earn" | "deduct" | "manual" | "wish";
  points: number;
  time: string;
};

export const records: Record[] = [
  {
    id: "1",
    childId: "1",
    childName: "小明",
    childAvatarBg: "#E8D5C4",
    childAvatarColor: "#5D4432",
    title: "刷牙打卡",
    meta: "任务完成 · 自动审核",
    type: "earn",
    points: 5,
    time: "今天 08:30",
  },
  {
    id: "2",
    childId: "2",
    childName: "小红",
    childAvatarBg: "#D5E8D4",
    childAvatarColor: "#2D7D46",
    title: "亲子阅读",
    meta: "任务完成 · 审核通过",
    type: "earn",
    points: 10,
    time: "今天 09:15",
  },
  {
    id: "3",
    childId: "1",
    childName: "小明",
    childAvatarBg: "#E8D5C4",
    childAvatarColor: "#5D4432",
    title: "主动帮忙做家务",
    meta: "手动加分 · 家长操作",
    type: "manual",
    points: 20,
    time: "今天 14:20",
  },
  {
    id: "4",
    childId: "2",
    childName: "小红",
    childAvatarBg: "#D5E8D4",
    childAvatarColor: "#2D7D46",
    title: "整理玩具",
    meta: "任务完成 · 自动审核",
    type: "earn",
    points: 5,
    time: "今天 16:45",
  },
  {
    id: "5",
    childId: "1",
    childName: "小明",
    childAvatarBg: "#E8D5C4",
    childAvatarColor: "#5D4432",
    title: "未按时完成作业",
    meta: "手动扣分 · 家长操作",
    type: "deduct",
    points: 10,
    time: "昨天 19:30",
  },
  {
    id: "6",
    childId: "2",
    childName: "小红",
    childAvatarBg: "#D5E8D4",
    childAvatarColor: "#2D7D46",
    title: "兑换「看动画片30分钟」",
    meta: "愿望兑换 · 梦想宝库",
    type: "wish",
    points: 50,
    time: "昨天 18:00",
  },
  {
    id: "7",
    childId: "1",
    childName: "小明",
    childAvatarBg: "#E8D5C4",
    childAvatarColor: "#5D4432",
    title: "户外运动",
    meta: "任务完成 · 审核通过",
    type: "earn",
    points: 15,
    time: "前天 17:20",
  },
  {
    id: "8",
    childId: "1",
    childName: "小明",
    childAvatarBg: "#E8D5C4",
    childAvatarColor: "#5D4432",
    title: "刷牙打卡",
    meta: "任务完成 · 自动审核",
    type: "earn",
    points: 5,
    time: "前天 08:10",
  },
];

export const recordSummary = {
  monthEarn: 320,
  monthDeduct: 20,
  netAdd: 300,
} as const;

export const themePresets = [
  { key: "sky", label: "天空", color: "#7DD3FC", gradient: "linear-gradient(135deg,#BAE6FD,#7DD3FC)" },
  { key: "coral", label: "珊瑚", color: "#FCA5A5", gradient: "linear-gradient(135deg,#FECDD3,#FCA5A5)" },
  { key: "mint", label: "薄荷", color: "#6EE7B7", gradient: "linear-gradient(135deg,#A7F3D0,#6EE7B7)" },
  { key: "lavender", label: "薰衣草", color: "#C4B5FD", gradient: "linear-gradient(135deg,#DDD6FE,#C4B5FD)" },
  { key: "sun", label: "阳光", color: "#FCD34D", gradient: "linear-gradient(135deg,#FDE68A,#FCD34D)" },
] as const;

export const adminColorPresets = [
  { color: "#5D4432", label: "咖啡棕" },
  { color: "#2563EB", label: "海蓝" },
  { color: "#059669", label: "森林绿" },
  { color: "#7C3AED", label: "紫藤" },
  { color: "#DC2626", label: "中国红" },
  { color: "#D97706", label: "琥珀" },
] as const;

export const iconPresets = [
  "💧", "📚", "🎳", "🧹", "💌", "🎨",
  "🎵", "💪", "💪", "🌱", "🐶", "⭐",
] as const;

export type ChildTask = {
  id: string;
  name: string;
  detail: string;
  icon: string;
  iconClass: string;
  points: number;
  status: "todo" | "pending" | "done";
  assignedChildIds: string[];
};

export const childTasks: ChildTask[] = [
  {
    id: "1",
    name: "亲子阅读",
    detail: "每天15分钟",
    icon: "📚",
    iconClass: "read",
    points: 10,
    status: "todo",
    assignedChildIds: ["1", "2"],
  },
  {
    id: "2",
    name: "户外运动",
    detail: "跑步或骑车30分钟",
    icon: "🎳",
    iconClass: "exercise",
    points: 15,
    status: "todo",
    assignedChildIds: ["1"],
  },
  {
    id: "3",
    name: "整理玩具",
    detail: "玩完后归位",
    icon: "🧹",
    iconClass: "organize",
    points: 5,
    status: "todo",
    assignedChildIds: ["1", "2"],
  },
  {
    id: "4",
    name: "帮妈妈做家务",
    detail: "擦桌子或扫地",
    icon: "💌",
    iconClass: "pink",
    points: 10,
    status: "todo",
    assignedChildIds: ["1"],
  },
  {
    id: "5",
    name: "刷牙",
    detail: "早晚各一次",
    icon: "💧",
    iconClass: "brush",
    points: 5,
    status: "done",
    assignedChildIds: ["1", "2"],
  },
  {
    id: "6",
    name: "收拾书包",
    detail: "睡前整理好明天的书包",
    icon: "💕",
    iconClass: "pink",
    points: 8,
    status: "pending",
    assignedChildIds: ["1"],
  },
  {
    id: "7",
    name: "跳绳100个",
    detail: "体育锻炼打卡",
    icon: "🎳",
    iconClass: "exercise",
    points: 10,
    status: "done",
    assignedChildIds: ["1"],
  },
];

export type ChildWish = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  current: number;
  color: "coral" | "lavender" | "mint" | "grass";
  ownerId: string;
};

export const childWishes: ChildWish[] = [
  { id: "1", name: "画笔套装", emoji: "🎨", cost: 50, current: 36, color: "coral", ownerId: "1" },
  { id: "2", name: "小吉他", emoji: "🎲", cost: 100, current: 40, color: "lavender", ownerId: "1" },
  { id: "3", name: "恐龙模型", emoji: "🚀", cost: 80, current: 80, color: "mint", ownerId: "1" },
  { id: "4", name: "游乐园", emoji: "🌈", cost: 200, current: 50, color: "grass", ownerId: "1" },
];

export type RedeemHistory = {
  id: string;
  name: string;
  emoji: string;
  date: string;
  cost: number;
  iconBg: string;
  childId: string;
};

export const redeemHistory: RedeemHistory[] = [
  { id: "1", name: "遥控赛车", emoji: "🚗", date: "2025年5月28日兑换", cost: 60, iconBg: "rgba(78,205,196,0.12)", childId: "1" },
  { id: "2", name: "冰淇淋派对", emoji: "🎁", date: "2025年5月20日兑换", cost: 30, iconBg: "rgba(255,107,107,0.12)", childId: "1" },
  { id: "3", name: "恐龙绘本", emoji: "📖", date: "2025年5月12日兑换", cost: 40, iconBg: "rgba(167,139,250,0.12)", childId: "1" },
];

export function getChildById(id: string): Child | null {
  return children.find((c) => c.id === id) ?? null;
}

export function getChildTasksForChild(childId: string): ChildTask[] {
  return childTasks.filter((t) => t.assignedChildIds.includes(childId));
}

export function getChildWishesForChild(childId: string): ChildWish[] {
  return childWishes.filter((w) => w.ownerId === childId);
}

export function getChildRedeemHistory(childId: string): RedeemHistory[] {
  return redeemHistory.filter((r) => r.childId === childId);
}

/* === Mock mutations (in-memory; persist only in single dev process) === */

export function submitTaskForReview(taskId: string): void {
  const task = childTasks.find((t) => t.id === taskId);
  if (task && task.status === "todo") {
    task.status = "pending";
  }
}

export function redeemWishForChild(wishId: string, childId: string): boolean {
  const wish = childWishes.find((w) => w.id === wishId && w.ownerId === childId);
  if (!wish || wish.current < wish.cost) return false;
  wish.current = wish.current - wish.cost;
  const child = children.find((c) => c.id === childId);
  if (child) {
    child.totalPoints = Math.max(0, child.totalPoints - wish.cost);
  }
  const date = new Date();
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日兑换`;
  redeemHistory.unshift({
    id: `h${Date.now()}`,
    name: wish.name,
    emoji: wish.emoji,
    date: dateStr,
    cost: wish.cost,
    iconBg: "rgba(255,217,61,0.15)",
    childId,
  });
  return true;
}

export function addTask(input: {
  name: string;
  icon: string;
  points: number;
  cycle: "daily" | "weekly" | "once";
  assignedChildren: string[];
}): Task {
  const id = `t${Date.now()}`;
  const task: Task = {
    id,
    name: input.name,
    icon: input.icon,
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    points: input.points,
    cycle: input.cycle,
    status: "active",
    assignedChildren: input.assignedChildren,
  };
  tasks.unshift(task);
  return task;
}

export function closeTask(taskId: string, reason: string): void {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = "closed";
    task.closedReason = reason;
  }
}

export function updateTask(
  taskId: string,
  patch: Partial<Pick<Task, "name" | "icon" | "points" | "cycle" | "assignedChildren">>
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  if (typeof patch.name === "string" && patch.name.trim()) task.name = patch.name.trim();
  if (typeof patch.icon === "string") task.icon = patch.icon;
  if (typeof patch.points === "number" && patch.points > 0) task.points = patch.points;
  if (patch.cycle) task.cycle = patch.cycle;
  if (Array.isArray(patch.assignedChildren)) task.assignedChildren = patch.assignedChildren;
  return true;
}

export function addWish(input: {
  name: string;
  image: string;
  points: number;
  owner: string;
  isFamily: boolean;
}): Wish {
  const id = `w${Date.now()}`;
  const wish: Wish = {
    id,
    name: input.name,
    image: input.image,
    points: input.points,
    owner: input.owner,
    isFamily: input.isFamily,
    progress: 0,
  };
  wishes.unshift(wish);
  return wish;
}

export function addChild(input: {
  name: string;
  themeKey: Child["themeKey"];
  themeColor: string;
}): Child {
  const id = `c${Date.now()}`;
  const child: Child = {
    id,
    name: input.name,
    slug: input.name.toLowerCase().replace(/\s+/g, "-"),
    themeKey: input.themeKey,
    themeColor: input.themeColor,
    totalPoints: 0,
    level: 1,
    avatarBg: input.themeColor,
    avatarColor: "#3E2B1E",
  };
  children.push(child);
  return child;
}

export function updateWish(
  wishId: string,
  patch: Partial<Pick<Wish, "name" | "image" | "points" | "owner" | "isFamily">>
): boolean {
  const wish = wishes.find((w) => w.id === wishId);
  if (!wish) return false;
  if (typeof patch.name === "string" && patch.name.trim()) wish.name = patch.name.trim();
  if (typeof patch.image === "string") wish.image = patch.image;
  if (typeof patch.points === "number" && patch.points > 0) wish.points = patch.points;
  if (typeof patch.owner === "string") wish.owner = patch.owner;
  if (typeof patch.isFamily === "boolean") wish.isFamily = patch.isFamily;
  return true;
}

export function updateChild(
  childId: string,
  patch: Partial<Pick<Child, "name" | "themeKey" | "themeColor">>
): boolean {
  const child = children.find((c) => c.id === childId);
  if (!child) return false;
  if (typeof patch.name === "string" && patch.name.trim()) {
    child.name = patch.name.trim();
    child.slug = child.name.toLowerCase().replace(/\s+/g, "-");
  }
  if (patch.themeKey) child.themeKey = patch.themeKey;
  if (typeof patch.themeColor === "string") {
    child.themeColor = patch.themeColor;
    child.avatarBg = patch.themeColor;
  }
  return true;
}

export function adjustPoints(
  childId: string,
  delta: number,
  reason: string,
  type: "manual" | "deduct"
): boolean {
  const child = children.find((c) => c.id === childId);
  if (!child || delta <= 0) return false;
  if (type === "deduct" && child.totalPoints < delta) return false;
  child.totalPoints += type === "deduct" ? -delta : delta;
  records.push({
    id: `r${Date.now()}`,
    childId: child.id,
    childName: child.name,
    childAvatarBg: child.themeColor,
    childAvatarColor: "#3E2B1E",
    title: reason || (type === "deduct" ? "手动扣分" : "手动加分"),
    meta: reason || (type === "deduct" ? "管理员调整" : "管理员调整"),
    type,
    points: delta,
    time: "刚刚",
  });
  return true;
}
