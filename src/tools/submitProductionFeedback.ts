import { SubmitProductionFeedbackInputSchema } from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId, createQuoteId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

export type SubmitProductionFeedbackOutput = {
  task_id: string;
  status: "production_feedback_received";
  production_feedback: {
    quote_id: string;
    total_amount: string | null;
    currency: string | null;
    feasible: boolean;
    confirmed_process?: string;
    quote?: string;
    sample_cost?: string;
    estimated_production_time?: string;
    estimated_shipping_time?: string;
    required_clarifications: string[];
    risks: string[];
    operator_notes?: string;
    submitted_at: string;
  };
  next_step: "Return this feedback to the user's AI interface and ask the user whether to proceed.";
};

export async function submitProductionFeedback(
  input: unknown,
  store: SupplyChainStore,
): Promise<SubmitProductionFeedbackOutput> {
  const parsed = SubmitProductionFeedbackInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }

  if (!task.productionRequest) {
    throw new Error("Production request must exist before submitting production feedback.");
  }
  assertTransition({
    from: task.status,
    to: "production_feedback_received",
    by: "submit_production_feedback",
    allowedFrom: [
      "production_requested",
      "production_feedback_received",
      "payment_link_created",
    ],
  });

  const productionFeedback = {
    quote_id: createQuoteId(),
    feasible: parsed.feasible,
    confirmed_process: parsed.confirmed_process,
    quote: parsed.quote,
    total_amount: parsed.total_amount ?? null,
    currency: parsed.currency ?? null,
    sample_cost: parsed.sample_cost,
    estimated_production_time: parsed.estimated_production_time,
    estimated_shipping_time: parsed.estimated_shipping_time,
    required_clarifications: parsed.required_clarifications ?? [],
    risks: parsed.risks ?? [],
    operator_notes: parsed.operator_notes,
    submitted_at: new Date().toISOString(),
  };

  await store.updateOrderWorkflow(parsed.task_id, {
    status: "production_feedback_received",
    productionFeedback,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "production_feedback_submitted",
    message: "Production side submitted feasibility, quote, lead time, and risk feedback.",
    metadata: productionFeedback,
  });

  return {
    task_id: parsed.task_id,
    status: "production_feedback_received",
    production_feedback: productionFeedback,
    next_step: "Return this feedback to the user's AI interface and ask the user whether to proceed.",
  };
}
