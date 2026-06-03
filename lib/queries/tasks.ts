// Stub: real implementation in Phase 2 task 2.3
export type Task = {
  id: number;
  ownerId: string;
  name: string;
  icon: string;
  points: number;
  cycle: string;
  status: boolean;
  closedReason: string | null;
  type: string | null;
  autoCheck: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskWithAssignments = Task & { assignedChildren: number[] };

export async function getTasksForAdmin(): Promise<TaskWithAssignments[]> {
  throw new Error("not implemented: getTasksForAdmin (Phase 2)");
}

export async function getTasksForChild(_shareToken: string): Promise<TaskWithAssignments[]> {
  throw new Error("not implemented: getTasksForChild (Phase 2)");
}
