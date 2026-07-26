import {
  ConfirmOrderDraftInputSchema,
  OrderDraftSchema,
  type OrderDraft,
} from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import { buildProductionRequestTextZh } from "./generateOrderDraft.js";
import type { SupplyChainStore } from "./store.js";

export type ConfirmOrderDraftOutput = {
  task_id: string;
  status: "user_confirmed" | "user_rejected";
  production_request?: {
    status: "pending_operator_review";
    requested_at: string;
    order_draft: unknown;
    production_request_text_zh: string;
  };
  next_step: string;
};

export async function confirmOrderDraft(
  input: unknown,
  store: SupplyChainStore,
): Promise<ConfirmOrderDraftOutput> {
  const parsed = ConfirmOrderDraftInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }

  const draft = OrderDraftSchema.safeParse(task.orderDraft);
  if (!draft.success) {
    throw new Error("Order draft must be generated before user confirmation.");
  }

  const confirmedAt = new Date().toISOString();
  const confirmationStatus: OrderDraft["confirmation_status"] = parsed.confirmed
    ? "user_confirmed"
    : "user_rejected";
  const orderDraft: OrderDraft = {
    ...draft.data,
    confirmation_status: confirmationStatus,
  };
  const userConfirmation = {
    confirmed: parsed.confirmed,
    message: parsed.message ?? null,
    confirmed_at: confirmedAt,
  };

  if (!parsed.confirmed) {
    assertTransition({
      from: task.status,
      to: "user_rejected",
      by: "confirm_order_draft",
      allowedFrom: ["order_draft_created"],
    });
    await store.updateOrderWorkflow(parsed.task_id, {
      status: "user_rejected",
      orderDraft,
      userConfirmation,
    });
    await store.createEvent({
      id: createEventId(),
      taskId: parsed.task_id,
      type: "order_draft_rejected",
      message: parsed.message ?? "User rejected the order draft.",
      metadata: userConfirmation,
    });

    return {
      task_id: parsed.task_id,
      status: "user_rejected",
      next_step: "Revise the task requirements and generate a new order draft.",
    };
  }

  const productionRequest = {
    status: "pending_operator_review" as const,
    requested_at: confirmedAt,
    order_draft: orderDraft,
    production_request_text_zh: buildProductionRequestTextZh(orderDraft),
  };
  assertTransition({
    from: task.status,
    to: "production_requested",
    by: "confirm_order_draft",
    allowedFrom: ["order_draft_created"],
    allowCompoundTransition: true,
  });

  await store.updateOrderWorkflow(parsed.task_id, {
    status: "production_requested",
    orderDraft,
    userConfirmation,
    productionRequest,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "production_request_created",
    message: "User confirmed the order draft. Production-side review is requested.",
    metadata: productionRequest,
  });

  return {
    task_id: parsed.task_id,
    status: "user_confirmed",
    production_request: productionRequest,
    next_step:
      "Production side should review feasibility, quote, lead time, risks, and required clarifications.",
  };
}
