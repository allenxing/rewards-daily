const ERROR_MAP: Record<string, string> = {
  "insufficient points": "INSUFFICIENT_POINTS",
  "audit not pending": "ALREADY_AUDITED",
  "audit not found or not owned": "TASK_NOT_FOUND",
  "task not found or not owned": "TASK_NOT_FOUND",
  "wish not redeemable": "WISH_NOT_REDEEMABLE",
  "wish not found": "WISH_NOT_FOUND",
  "child not found or not owned": "CHILD_NOT_FOUND_OR_OWNED",
  "invalid type": "INVALID_OPERATION_TYPE",
  "duplicate key value violates unique constraint": "DUPLICATE_ENTRY",
  "new row violates row-level security policy": "PERMISSION_DENIED",
};

export function translateSupabaseError(msg: string): string {
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return msg;
}
