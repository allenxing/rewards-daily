"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateSupabaseError } from "@/lib/utils/errors";

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  const msg = error instanceof Error ? error.message : String(error);
  return { ok: false, error: translateSupabaseError(msg) };
}

async function getOwnerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function addTaskAction(formData: FormData): Promise<ActionResult<number>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "⭐");
  const points = Number(formData.get("points") ?? 0);
  const cycle = String(formData.get("cycle") ?? "daily") as
    | "daily"
    | "weekly"
    | "once";
  const assigned = formData.getAll("assignedChildren").map((v) => String(v));
  if (!name || points <= 0) return { ok: false, error: "TASK_NAME_REQUIRED" };

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ owner_id: ownerId, name, icon, points, cycle, status: true })
    .select("id")
    .single();
  if (error) return fail(error);
  if (assigned.length > 0) {
    const rows = assigned.map((cid) => ({
      task_id: task.id,
      child_id: Number(cid),
      owner_id: ownerId,
    }));
    const { error: aErr } = await supabase.from("task_assignments").insert(rows);
    if (aErr) return fail(aErr);
  }
  revalidatePath("/admin/tasks");
  return { ok: true, data: task.id };
}

export async function updateTaskAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const taskId = Number(formData.get("taskId") ?? 0);
  if (!taskId) return { ok: false, error: "MISSING_TASK_ID" };
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "⭐");
  const points = Number(formData.get("points") ?? 0);
  const cycle = String(formData.get("cycle") ?? "daily") as
    | "daily"
    | "weekly"
    | "once";
  const assigned = formData.getAll("assignedChildren").map((v) => String(v));
  if (!name || points <= 0) return { ok: false, error: "TASK_NAME_REQUIRED" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ name, icon, points, cycle, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);

  await supabase.from("task_assignments").delete().eq("task_id", taskId);
  if (assigned.length > 0) {
    const rows = assigned.map((cid) => ({
      task_id: taskId,
      child_id: Number(cid),
      owner_id: ownerId,
    }));
    const { error: aErr } = await supabase.from("task_assignments").insert(rows);
    if (aErr) return fail(aErr);
  }
  revalidatePath("/admin/tasks");
  return { ok: true };
}

export async function closeTaskAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const taskId = Number(formData.get("taskId") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim() || "ALREADY_CLOSED";
  if (!taskId) return { ok: false, error: "MISSING_TASK_ID" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: false, closed_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin/tasks");
  return { ok: true };
}

export async function restoreTaskAction(taskId: number): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: true, closed_reason: null, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin/tasks");
  return { ok: true };
}

export async function submitTaskAction(
  shareToken: string,
  taskId: string
): Promise<ActionResult<number>> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id, owner_id")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (!child) return { ok: false, error: "INVALID_SHARE_LINK" };

  const taskIdNum = Number(taskId);
  if (!taskIdNum) return { ok: false, error: "MISSING_TASK_ID" };

  const { data: audit, error } = await supabase
    .from("task_audit")
    .insert({
      owner_id: child.owner_id,
      child_id: child.id,
      task_id: taskIdNum,
      audit_status: "pending",
    })
    .select("id")
    .single();
  if (error) return fail(error);
  revalidatePath(`/child/${shareToken}/tasks`);
  revalidatePath(`/child/${shareToken}`);
  return { ok: true, data: audit.id };
}

export async function approveTaskAction(auditId: number): Promise<ActionResult<{ points: number }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_task", {
    p_audit_id: auditId,
  });
  if (error) return fail(error);
  const result = data as { ok: boolean; points: number };
  revalidatePath("/admin");
  revalidatePath("/admin/records");
  revalidatePath("/admin/children");
  return { ok: true, data: { points: result.points } };
}

export async function rejectTaskAction(
  auditId: number,
  reason: string
): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_audit")
    .update({
      audit_status: "refuse",
      audit_time: new Date().toISOString(),
      refuse_reason: reason,
    })
    .eq("id", auditId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin");
  return { ok: true };
}

export async function addWishAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("image") ?? "🎁");
  const targetPoints = Number(formData.get("points") ?? 0);
  const owner = String(formData.get("owner") ?? "");
  if (!name || targetPoints <= 0 || !owner) return { ok: false, error: "MISSING_INFO" };
  const isFamily = owner === "family";

  const supabase = await createClient();
  const { error } = await supabase.from("wishes").insert({
    owner_id: ownerId,
    name,
    emoji,
    target_points: targetPoints,
    child_id: isFamily ? null : Number(owner),
    is_family: isFamily,
  });
  if (error) return fail(error);
  revalidatePath("/admin/wishes");
  revalidatePath("/child");
  return { ok: true };
}

export async function updateWishAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const wishId = Number(formData.get("wishId") ?? 0);
  if (!wishId) return { ok: false, error: "MISSING_WISH_ID" };
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("image") ?? "🎁");
  const targetPoints = Number(formData.get("points") ?? 0);
  const owner = String(formData.get("owner") ?? "");
  if (!name || targetPoints <= 0 || !owner) return { ok: false, error: "MISSING_INFO" };
  const isFamily = owner === "family";

  const supabase = await createClient();
  const { error } = await supabase
    .from("wishes")
    .update({
      name,
      emoji,
      target_points: targetPoints,
      child_id: isFamily ? null : Number(owner),
      is_family: isFamily,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wishId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin/wishes");
  revalidatePath("/child");
  return { ok: true };
}

export async function lockWishAction(
  wishId: number,
  locked: boolean
): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("wishes")
    .update({ is_lock: locked, updated_at: new Date().toISOString() })
    .eq("id", wishId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin/wishes");
  revalidatePath("/child");
  return { ok: true };
}

export async function deleteWishAction(wishId: number): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", wishId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin/wishes");
  revalidatePath("/child");
  return { ok: true };
}

export async function redeemWishAction(input: {
  shareToken: string;
  wishId: number;
}): Promise<ActionResult<{ remaining: number }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_wish", {
    p_share_token: input.shareToken,
    p_wish_id: input.wishId,
  });
  if (error) return fail(error);
  const result = data as { ok: boolean; remaining: number };
  revalidatePath(`/child/${input.shareToken}/wishes`);
  revalidatePath(`/child/${input.shareToken}`);
  return { ok: true, data: { remaining: result.remaining } };
}

export async function addChildAction(formData: FormData): Promise<ActionResult<number>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const name = String(formData.get("name") ?? "").trim();
  const themeKey = String(formData.get("themeKey") ?? "sky");
  const themeColor = String(formData.get("themeColor") ?? "#7DD3FC");
  const avatarStyle = String(formData.get("avatarStyle") ?? "smile");
  if (!name) return { ok: false, error: "CHILD_NAME_REQUIRED" };

  const slug = `${name}-${Math.random().toString(36).slice(2, 8)}`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .insert({
      owner_id: ownerId,
      name,
      slug,
      theme_key: themeKey,
      theme_color: themeColor,
      avatar_style: avatarStyle,
    })
    .select("id")
    .single();
  if (error) return fail(error);
  revalidatePath("/admin/children");
  revalidatePath("/admin");
  return { ok: true, data: data.id };
}

export async function updateChildAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const childId = Number(formData.get("childId") ?? 0);
  if (!childId) return { ok: false, error: "MISSING_CHILD_ID" };
  const name = String(formData.get("name") ?? "").trim();
  const themeKey = String(formData.get("themeKey") ?? "sky");
  const themeColor = String(formData.get("themeColor") ?? "#7DD3FC");
  const avatarStyle = String(formData.get("avatarStyle") ?? "smile");
  if (!name) return { ok: false, error: "CHILD_NAME_REQUIRED" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("children")
    .update({
      name,
      theme_key: themeKey,
      theme_color: themeColor,
      avatar_style: avatarStyle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", childId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  revalidatePath("/admin/children");
  revalidatePath("/admin");
  revalidatePath("/child");
  return { ok: true };
}

export async function deleteChildAction(childId: number): Promise<ActionResult<{ counts: { tasks: number; audits: number; wishes: number; records: number } }>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();

  const { data: child } = await supabase
    .from("children")
    .select("id, name")
    .eq("id", childId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!child) return { ok: false, error: "CHILD_NOT_FOUND" };

  const [t, a, w, r] = await Promise.all([
    supabase.from("task_assignments").select("task_id", { count: "exact", head: true }).eq("child_id", childId),
    supabase.from("task_audit").select("id", { count: "exact", head: true }).eq("child_id", childId),
    supabase.from("wishes").select("id", { count: "exact", head: true }).eq("child_id", childId),
    supabase.from("points_records").select("id", { count: "exact", head: true }).eq("child_id", childId),
  ]);
  const counts = {
    tasks: t.count ?? 0,
    audits: a.count ?? 0,
    wishes: w.count ?? 0,
    records: r.count ?? 0,
  };

  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", childId)
    .eq("owner_id", ownerId);
  if (error) return fail(error);

  const { data: avatarData } = await supabase.storage
    .from("avatar")
    .list(`${ownerId}/${childId}`);
  if (avatarData && avatarData.length > 0) {
    await supabase.storage
      .from("avatar")
      .remove(avatarData.map((f) => `${ownerId}/${childId}/${f.name}`));
  }

  revalidatePath("/admin/children");
  revalidatePath("/admin");
  return { ok: true, data: { counts } };
}

export async function uploadAvatarAction(
  childId: number,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "FILE_NOT_SELECTED" };
  if (file.size === 0) return { ok: false, error: "FILE_EMPTY" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "FILE_TOO_LARGE" };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${ownerId}/${childId}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error: upErr } = await supabase.storage
    .from("avatar")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return fail(upErr);

  const { data: pub } = supabase.storage.from("avatar").getPublicUrl(path);
  const { error: dbErr } = await supabase
    .from("children")
    .update({ avatar_url: path, updated_at: new Date().toISOString() })
    .eq("id", childId)
    .eq("owner_id", ownerId);
  if (dbErr) return fail(dbErr);

  revalidatePath("/admin/children");
  revalidatePath("/child");
  return { ok: true, data: { url: pub.publicUrl } };
}

export async function adjustPointsAction(formData: FormData): Promise<ActionResult<{ newTotal: number }>> {
  const childId = Number(formData.get("childId") ?? 0);
  const delta = Number(formData.get("points") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim() || "manual_adjust";
  const type = String(formData.get("type") ?? "manual");
  if (!childId || delta <= 0) return { ok: false, error: "POINTS_REQUIRED" };
  if (type !== "manual" && type !== "deduct") return { ok: false, error: "INVALID_OPERATION_TYPE" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_points", {
    p_child_id: childId,
    p_delta: delta,
    p_reason: reason,
    p_type: type,
  });
  if (error) return fail(error);
  const result = data as { ok: boolean; new_total: number };

  revalidatePath("/admin");
  revalidatePath("/admin/records");
  revalidatePath("/admin/children");
  return { ok: true, data: { newTotal: result.new_total } };
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!/^\d{4}$/.test(next)) return { ok: false, error: "INVALID_PASSWORD_FORMAT" };
  if (next !== confirm) return { ok: false, error: "PASSWORD_MISMATCH" };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("settings")
    .select("admin_pwd")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!row) return { ok: false, error: "LOGIN_REQUIRED" };
  if (row.admin_pwd !== current) return { ok: false, error: "WRONG_CURRENT_PASSWORD" };

  const { error } = await supabase
    .from("settings")
    .update({ admin_pwd: next, updated_at: new Date().toISOString() })
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  return { ok: true };
}

export async function setSecurityQuestionAction(formData: FormData): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return { ok: false, error: "QUESTION_ANSWER_REQUIRED" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      security_question: question,
      security_answer: answer,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  return { ok: true };
}

export async function updateSettingAction(
  key: "global_theme" | "sound_open" | "compact_mode" | "child_access_pwd_enabled",
  value: string | boolean
): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ [key]: value, updated_at: new Date().toISOString() })
    .eq("owner_id", ownerId);
  if (error) return fail(error);
  return { ok: true };
}

export async function exportRecordsAction(): Promise<ActionResult<{ json: string; filename: string }>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("points_records")
    .select("id, child_id, record_type, points, remark, create_time, children(name)")
    .eq("owner_id", ownerId)
    .order("create_time", { ascending: false })
    .limit(1000);
  if (error) return fail(error);

  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      records: (data ?? []).map((r) => {
        const join = r as unknown as { children: { name: string }[] };
        return {
          id: r.id,
          childId: r.child_id,
          childName: join.children?.[0]?.name ?? "",
          type: r.record_type,
          points: r.points,
          remark: r.remark,
          time: r.create_time,
        };
      }),
    },
    null,
    2
  );
  const filename = `rewards-records-${new Date().toISOString().slice(0, 10)}.json`;
  return { ok: true, data: { json, filename } };
}

export async function backupDataAction(): Promise<ActionResult<{ json: string; filename: string }>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();

  const [children, tasks, assignments, audits, wishes, records, settings] = await Promise.all([
    supabase.from("children").select("*").eq("owner_id", ownerId),
    supabase.from("tasks").select("*").eq("owner_id", ownerId),
    supabase.from("task_assignments").select("*").eq("owner_id", ownerId),
    supabase.from("task_audit").select("*").eq("owner_id", ownerId),
    supabase.from("wishes").select("*").eq("owner_id", ownerId),
    supabase.from("points_records").select("*").eq("owner_id", ownerId),
    supabase.from("settings").select("*").eq("owner_id", ownerId).maybeSingle(),
  ]);

  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      ownerId,
      children: children.data ?? [],
      tasks: tasks.data ?? [],
      task_assignments: assignments.data ?? [],
      task_audit: audits.data ?? [],
      wishes: wishes.data ?? [],
      points_records: records.data ?? [],
      settings: settings.data ?? null,
    },
    null,
    2
  );
  const filename = `rewards-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return { ok: true, data: { json, filename } };
}

export async function restoreDataAction(formData: FormData): Promise<ActionResult<{ counts: Record<string, number> }>> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "FILE_NOT_SELECTED" };
  const text = await file.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false, error: "INVALID_JSON" };
  }
  if (!payload || typeof payload !== "object" || !("version" in payload)) {
    return { ok: false, error: "INVALID_BACKUP_FORMAT" };
  }

  const supabase = await createClient();
  await supabase.from("points_records").delete().eq("owner_id", ownerId);
  await supabase.from("wishes").delete().eq("owner_id", ownerId);
  await supabase.from("task_audit").delete().eq("owner_id", ownerId);
  await supabase.from("task_assignments").delete().eq("owner_id", ownerId);
  await supabase.from("tasks").delete().eq("owner_id", ownerId);
  await supabase.from("children").delete().eq("owner_id", ownerId);

  const counts: Record<string, number> = {};
  const tableMap: Record<string, string> = {
    children: "children",
    tasks: "tasks",
    task_assignments: "task_assignments",
    task_audit: "task_audit",
    wishes: "wishes",
    points_records: "points_records",
  };
  for (const [key, table] of Object.entries(tableMap)) {
    const rows = payload[key];
    if (Array.isArray(rows) && rows.length > 0) {
      const withOwner = (rows as Record<string, unknown>[]).map((r) => ({
        ...r,
        owner_id: ownerId,
      }));
      const { error } = await supabase.from(table).insert(withOwner);
      if (error) return fail(error);
      counts[key] = rows.length;
    } else {
      counts[key] = 0;
    }
  }
  if (payload.settings && typeof payload.settings === "object") {
    const { error } = await supabase
      .from("settings")
      .update({ updated_at: new Date().toISOString() })
      .eq("owner_id", ownerId);
    if (error) return fail(error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/children");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/wishes");
  revalidatePath("/admin/records");
  return { ok: true, data: { counts } };
}

export async function clearAllDataAction(): Promise<ActionResult> {
  const ownerId = await getOwnerId();
  if (!ownerId) return { ok: false, error: "LOGIN_REQUIRED" };
  const supabase = await createClient();

  await supabase.from("points_records").delete().eq("owner_id", ownerId);
  await supabase.from("wishes").delete().eq("owner_id", ownerId);
  await supabase.from("task_audit").delete().eq("owner_id", ownerId);
  await supabase.from("task_assignments").delete().eq("owner_id", ownerId);
  await supabase.from("tasks").delete().eq("owner_id", ownerId);
  await supabase.from("children").delete().eq("owner_id", ownerId);

  const { data: kids } = await supabase
    .from("children")
    .select("id")
    .eq("owner_id", ownerId);
  for (const c of kids ?? []) {
    const { data: avatars } = await supabase.storage
      .from("avatar")
      .list(`${ownerId}/${c.id}`);
    if (avatars && avatars.length > 0) {
      await supabase.storage
        .from("avatar")
        .remove(avatars.map((f) => `${ownerId}/${c.id}/${f.name}`));
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/children");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/wishes");
  revalidatePath("/admin/records");
  return { ok: true };
}
