"use server";

import { revalidatePath } from "next/cache";
import {
  addChild,
  addTask,
  addWish,
  adjustPoints,
  closeTask,
  submitTaskForReview,
  updateChild,
  updateTask,
  updateWish,
} from "./mock-data";

export async function addTaskAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "⭐");
  const points = Number(formData.get("points") ?? 0);
  const cycle = String(formData.get("cycle") ?? "daily") as
    | "daily"
    | "weekly"
    | "once";
  const assigned = formData.getAll("assignedChildren").map((v) => String(v));
  if (!name || points <= 0) return;
  addTask({ name, icon, points, cycle, assignedChildren: assigned });
  revalidatePath("/admin/tasks");
}

export async function updateTaskAction(formData: FormData): Promise<void> {
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "⭐");
  const points = Number(formData.get("points") ?? 0);
  const cycle = String(formData.get("cycle") ?? "daily") as
    | "daily"
    | "weekly"
    | "once";
  const assigned = formData.getAll("assignedChildren").map((v) => String(v));
  if (!name || points <= 0) return;
  updateTask(taskId, { name, icon, points, cycle, assignedChildren: assigned });
  revalidatePath("/admin/tasks");
}

export async function closeTaskAction(formData: FormData): Promise<void> {
  const taskId = String(formData.get("taskId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "已关闭";
  if (!taskId) return;
  closeTask(taskId, reason);
  revalidatePath("/admin/tasks");
}

export async function addWishAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const image = String(formData.get("image") ?? "🎁");
  const points = Number(formData.get("points") ?? 0);
  const owner = String(formData.get("owner") ?? "");
  if (!name || points <= 0 || !owner) return;
  const isFamily = owner === "家庭";
  addWish({ name, image, points, owner: isFamily ? "全家" : owner, isFamily });
  revalidatePath("/admin/wishes");
  revalidatePath("/child");
}

export async function updateWishAction(formData: FormData): Promise<void> {
  const wishId = String(formData.get("wishId") ?? "");
  if (!wishId) return;
  const name = String(formData.get("name") ?? "").trim();
  const image = String(formData.get("image") ?? "🎁");
  const points = Number(formData.get("points") ?? 0);
  const owner = String(formData.get("owner") ?? "");
  if (!name || points <= 0 || !owner) return;
  const isFamily = owner === "家庭";
  updateWish(wishId, {
    name,
    image,
    points,
    owner: isFamily ? "全家" : owner,
    isFamily,
  });
  revalidatePath("/admin/wishes");
  revalidatePath("/child");
}

export async function addChildAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const themeKey = String(formData.get("themeKey") ?? "sky") as
    | "sky"
    | "coral"
    | "mint"
    | "lavender"
    | "sun";
  const themeColor = String(formData.get("themeColor") ?? "#7DD3FC");
  if (!name) return;
  addChild({ name, themeKey, themeColor });
  revalidatePath("/admin/children");
}

export async function updateChildAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("childId") ?? "");
  if (!childId) return;
  const name = String(formData.get("name") ?? "").trim();
  const themeKey = String(formData.get("themeKey") ?? "sky") as
    | "sky"
    | "coral"
    | "mint"
    | "lavender"
    | "sun";
  const themeColor = String(formData.get("themeColor") ?? "#7DD3FC");
  if (!name) return;
  updateChild(childId, { name, themeKey, themeColor });
  revalidatePath("/admin/children");
  revalidatePath("/child");
}

export async function submitTaskAction(taskId: string): Promise<void> {
  submitTaskForReview(taskId);
  revalidatePath("/child/[childId]/tasks", "page");
  revalidatePath("/child/[childId]", "page");
}

export async function redeemWishAction(input: {
  wishId: number;
  shareToken: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { redeemWishForChild } = await import("./mock-data");
  const ok = redeemWishForChild(String(input.wishId), input.shareToken);
  if (ok) {
    revalidatePath(`/child/${input.shareToken}/wishes`);
    revalidatePath(`/child/${input.shareToken}`);
  }
  return { ok };
}

export async function adjustPointsAction(formData: FormData): Promise<boolean> {
  const childId = String(formData.get("childId") ?? "");
  const delta = Number(formData.get("points") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  const type = String(formData.get("type") ?? "manual") as "manual" | "deduct";
  if (!childId || delta <= 0) return false;
  const ok = adjustPoints(childId, delta, reason, type);
  if (ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/records");
    revalidatePath("/admin/children");
  }
  return ok;
}
