import type { z } from "zod";
import { CreateSupplyChainTaskInputSchema } from "../domain/schemas.js";
import { createSupplyChainTask } from "./createSupplyChainTask.js";
import { generateOrderDraft } from "./generateOrderDraft.js";
import type { SupplyChainStore } from "./store.js";

export type QuickStartPrototypeInput = z.infer<typeof CreateSupplyChainTaskInputSchema>;

/**
 * Bundles only safe pre-confirmation work. The macro deliberately stops at the
 * order draft and cannot confirm, pay, order, produce, or ship anything.
 */
export async function quickStartPrototypePipeline(
  input: QuickStartPrototypeInput,
  store: SupplyChainStore,
): Promise<Record<string, unknown>> {
  const task = (await createSupplyChainTask(input, store)) as Record<string, unknown>;
  const taskId = task.task_id as string;
  const draft = (await generateOrderDraft(
    { task_id: taskId, user_language: "en" },
    store,
  )) as Record<string, unknown>;

  return {
    pipeline: ["create_supplychain_task", "generate_order_draft"],
    stopped_before: "confirm_order_draft",
    task_id: taskId,
    task,
    ...draft,
  };
}
