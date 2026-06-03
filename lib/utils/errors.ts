const ERROR_MAP: Record<string, string> = {
  "insufficient points": "积分不足",
  "insufficient points for deduct": "积分不足,无法扣分",
  "audit not pending": "该任务已审核,无法重复操作",
  "audit not found or not owned": "任务不存在或无权限",
  "task not found or not owned": "任务不存在或无权限",
  "wish not redeemable": "该愿望已锁定或已兑换",
  "wish not found": "愿望不存在",
  "child not found or not owned": "孩子不存在或无权限",
  "invalid type": "无效操作类型",
  "duplicate key value violates unique constraint": "该记录已存在",
  "new row violates row-level security policy": "无权限操作",
};

export function translateSupabaseError(msg: string): string {
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return msg;
}
