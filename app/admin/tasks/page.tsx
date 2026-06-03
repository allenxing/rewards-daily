import { TasksClient } from "./tasks-client";
import { getTasksForAdmin } from "@/lib/queries/tasks";
import { getChildren } from "@/lib/queries/children";

export default async function AdminTasksPage() {
  const [tasks, kids] = await Promise.all([getTasksForAdmin(), getChildren()]);
  return <TasksClient tasks={tasks} kidsList={kids} />;
}
