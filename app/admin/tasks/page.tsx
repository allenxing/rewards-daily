import { Suspense } from "react";
import { tasks, children } from "@/lib/mock-data";
import { TasksClient } from "./tasks-client";

export default function AdminTasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksClient tasks={tasks} kidsList={children} />
    </Suspense>
  );
}
