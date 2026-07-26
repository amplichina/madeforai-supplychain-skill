import {
  CompleteTaskInputSchema,
  PaymentIntentSchema,
  SubmitShipmentInfoInputSchema,
  UpdateProductionStatusInputSchema,
} from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore, TaskWithRelations } from "./store.js";

type FulfillmentState = {
  production_updates: Array<{
    stage: string;
    message: string | null;
    production_photos: string[];
    operator_notes: string | null;
    updated_at: string;
  }>;
  shipment: null | {
    carrier: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    shipped_at: string | null;
    estimated_delivery: string | null;
    shipping_notes: string | null;
    submitted_at: string;
  };
  completion: null | {
    delivered_at: string | null;
    completion_notes: string | null;
    proof_urls: string[];
    completed_at: string;
  };
};

function baseFulfillment(task: TaskWithRelations): FulfillmentState {
  const existing = task.fulfillment as Partial<FulfillmentState> | null;
  return {
    production_updates: Array.isArray(existing?.production_updates)
      ? existing.production_updates
      : [],
    shipment: existing?.shipment ?? null,
    completion: existing?.completion ?? null,
  };
}

function ensurePaymentConfirmed(task: TaskWithRelations): void {
  const payment = PaymentIntentSchema.safeParse(task.paymentIntent);
  if (!payment.success || payment.data.status !== "confirmed") {
    throw new Error("Payment must be confirmed before production fulfillment can proceed.");
  }
}

export async function updateProductionStatus(
  input: unknown,
  store: SupplyChainStore,
): Promise<{
  task_id: string;
  status: "production_ready" | "production_in_progress" | "quality_check";
  fulfillment: FulfillmentState;
  next_step: string;
}> {
  const parsed = UpdateProductionStatusInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) throw new Error(`Task not found: ${parsed.task_id}`);
  ensurePaymentConfirmed(task);
  assertTransition({
    from: task.status,
    to: parsed.stage,
    by: "update_production_status",
    allowedFrom: [
      "payment_confirmed",
      "sample_ordered",
      "sample_ready",
      "production_ready",
      "production_in_progress",
      "quality_check",
    ],
  });

  const fulfillment = baseFulfillment(task);
  fulfillment.production_updates.push({
    stage: parsed.stage,
    message: parsed.message ?? null,
    production_photos: parsed.production_photos ?? [],
    operator_notes: parsed.operator_notes ?? null,
    updated_at: new Date().toISOString(),
  });

  await store.updateOrderWorkflow(parsed.task_id, {
    status: parsed.stage,
    fulfillment,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "production_status_updated",
    message: parsed.message ?? `Production status updated to ${parsed.stage}.`,
    metadata: { stage: parsed.stage, production_photos: parsed.production_photos ?? [] },
  });

  return {
    task_id: parsed.task_id,
    status: parsed.stage,
    fulfillment,
    next_step:
      parsed.stage === "quality_check"
        ? "Submit shipment information after quality check passes."
        : "Continue production updates until quality check and shipment.",
  };
}

export async function submitShipmentInfo(
  input: unknown,
  store: SupplyChainStore,
): Promise<{
  task_id: string;
  status: "shipped";
  shipment: NonNullable<FulfillmentState["shipment"]>;
  fulfillment: FulfillmentState;
  next_step: "Return shipment details to the user's AI interface and continue tracking delivery.";
}> {
  const parsed = SubmitShipmentInfoInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) throw new Error(`Task not found: ${parsed.task_id}`);
  ensurePaymentConfirmed(task);
  assertTransition({
    from: task.status,
    to: "shipped",
    by: "submit_shipment_info",
    allowedFrom: ["quality_check"],
  });

  const fulfillment = baseFulfillment(task);
  if (fulfillment.production_updates.length === 0) {
    throw new Error(
      "At least one production status update is required before shipment can be submitted.",
    );
  }
  const shipment = {
    carrier: parsed.carrier ?? null,
    tracking_number: parsed.tracking_number ?? null,
    tracking_url: parsed.tracking_url ?? null,
    shipped_at: parsed.shipped_at ?? new Date().toISOString(),
    estimated_delivery: parsed.estimated_delivery ?? null,
    shipping_notes: parsed.shipping_notes ?? null,
    submitted_at: new Date().toISOString(),
  };
  fulfillment.shipment = shipment;

  await store.updateOrderWorkflow(parsed.task_id, {
    status: "shipped",
    fulfillment,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "shipment_info_submitted",
    message: "Shipment information submitted by production side.",
    metadata: shipment,
  });

  return {
    task_id: parsed.task_id,
    status: "shipped",
    shipment,
    fulfillment,
    next_step: "Return shipment details to the user's AI interface and continue tracking delivery.",
  };
}

export async function completeTask(
  input: unknown,
  store: SupplyChainStore,
): Promise<{
  task_id: string;
  status: "completed";
  completion: NonNullable<FulfillmentState["completion"]>;
  fulfillment: FulfillmentState;
  next_step: "Task is completed. Return final delivery notes to the user's AI interface.";
}> {
  const parsed = CompleteTaskInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) throw new Error(`Task not found: ${parsed.task_id}`);
  ensurePaymentConfirmed(task);
  assertTransition({
    from: task.status,
    to: "completed",
    by: "complete_task",
    allowedFrom: ["shipped"],
  });

  const fulfillment = baseFulfillment(task);
  if (!fulfillment.shipment) {
    throw new Error("Shipment information is required before the task can be completed.");
  }
  const completion = {
    delivered_at: parsed.delivered_at ?? new Date().toISOString(),
    completion_notes: parsed.completion_notes ?? null,
    proof_urls: parsed.proof_urls ?? [],
    completed_at: new Date().toISOString(),
  };
  fulfillment.completion = completion;

  await store.updateOrderWorkflow(parsed.task_id, {
    status: "completed",
    fulfillment,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "task_completed",
    message: "Task completed and delivery feedback recorded.",
    metadata: completion,
  });

  return {
    task_id: parsed.task_id,
    status: "completed",
    completion,
    fulfillment,
    next_step: "Task is completed. Return final delivery notes to the user's AI interface.",
  };
}
