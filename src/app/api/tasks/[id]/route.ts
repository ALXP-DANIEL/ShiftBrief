// PATCH /api/tasks/[id] — update a single task's status.

import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { store } from "@/lib/shiftbrief/store";
import { taskStatusSchema } from "@/lib/shiftbrief/validation";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = taskStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid status");
  }

  try {
    const task = await store.updateTaskStatus(id, parsed.data.status);
    if (!task) return apiError("Task not found", 404);
    return apiOk(task);
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
