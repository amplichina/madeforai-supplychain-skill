import { UpdateTaskStatusInputSchema } from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

const MANUAL_STATUS_TARGETS = new Set(["operator_reviewing", "quote_requested", "cancelled"]);

export type UpdateTaskStatusOutput = {
  task_id: string;
  status: string;
  updated_at: string;
};

export async function updateTaskStatus(
  input: unknown,
  store: SupplyChainStore,
): Promise<UpdateTaskStatusOutput> {
  const parsed = UpdateTaskStatusInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }
  assertTransition({
    from: task.status,
    to: parsed.status,
    by: "update_task_status",
  });
  if (!MANUAL_STATUS_TARGETS.has(parsed.status)) {
    throw new Error(
      `update_task_status cannot set evidence-bearing status "${parsed.status}". Use the dedicated business tool for that stage.`,
    );
  }
  const updated = await store.updateTaskStatus(parsed.task_id, parsed.status);

  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "status_updated",
    message: parsed.message ?? `Status updated to ${parsed.status}.`,
    metadata: { status: parsed.status },
  });

  return {
    task_id: parsed.task_id,
    status: updated.status,
    updated_at: updated.updatedAt.toISOString(),
  };
}
