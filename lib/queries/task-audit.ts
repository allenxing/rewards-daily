// Stub: real implementation in Phase 2 task 2.4
export type Audit = {
  id: number;
  ownerId: string;
  taskId: number;
  childId: number;
  auditStatus: "pending" | "agree" | "refuse";
  submitTime: string;
  auditTime: string | null;
  refuseReason: string | null;
};

export type AuditWithJoins = Audit & {
  taskName: string;
  taskPoints: number;
  childName: string;
};

export async function getPendingAudits(_limit = 20): Promise<AuditWithJoins[]> {
  throw new Error("not implemented: getPendingAudits (Phase 2)");
}

export async function getAuditsForChild(
  _shareToken: string,
  _filter?: "pending" | "done" | "all"
): Promise<AuditWithJoins[]> {
  throw new Error("not implemented: getAuditsForChild (Phase 2)");
}
