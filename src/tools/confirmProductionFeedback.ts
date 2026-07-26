import { ConfirmProductionFeedbackInputSchema } from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

export async function confirmProductionFeedback(
  input: unknown,
  store: SupplyChainStore,
): Promise<Record<string, unknown>> {
  const parsed = ConfirmProductionFeedbackInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) throw new Error(`Task not found: ${parsed.task_id}`);
  const feedback = task.productionFeedback as Record<string, unknown> | null;
  if (!feedback) {
    throw new Error("No production feedback to confirm yet: the operator has not responded.");
  }
  if (feedback.quote_id !== parsed.accepted_quote_id) {
    throw new Error("accepted_quote_id does not match the current operator quote.");
  }
  if (parsed.accepted && feedback.feasible !== true) {
    throw new Error("An infeasible production proposal cannot be accepted for payment.");
  }
  if (parsed.accepted && !parsed.accepted_risks) {
    throw new Error("The user must also accept the stated risks before payment can be initiated.");
  }
  if (
    parsed.accepted &&
    (typeof feedback.total_amount !== "string" || feedback.total_amount.trim() === "")
  ) {
    throw new Error("The operator must record a total_amount before the quote can be accepted.");
  }
  assertTransition({
    from: task.status,
    to: parsed.accepted ? "production_feedback_received" : "user_rejected",
    by: "confirm_production_feedback",
    allowedFrom: ["production_feedback_received"],
  });

  const confirmedAt = new Date().toISOString();
  const confirmation = {
    accepted: parsed.accepted,
    accepted_quote_id: parsed.accepted_quote_id,
    accepted_risks: parsed.accepted_risks,
    confirmed_at: confirmedAt,
    message: parsed.message ?? null,
    accepted_quote_snapshot: {
      quote: feedback.quote ?? null,
      total_amount: feedback.total_amount ?? null,
      currency: feedback.currency ?? null,
      sample_cost: feedback.sample_cost ?? null,
      estimated_production_time: feedback.estimated_production_time ?? null,
      estimated_shipping_time: feedback.estimated_shipping_time ?? null,
    },
    accepted_risk_snapshot: feedback.risks ?? [],
  };

  const status = parsed.accepted ? "production_feedback_received" : "user_rejected";
  await store.updateOrderWorkflow(parsed.task_id, {
    status,
    productionFeedback: { ...feedback, user_confirmation: confirmation },
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: parsed.accepted ? "production_feedback_confirmed" : "production_feedback_rejected",
    message: parsed.accepted
      ? "User accepted the operator quote and risks."
      : "User rejected the operator quote or risks.",
    metadata: {
      accepted_quote_id: parsed.accepted_quote_id,
      accepted_risks: parsed.accepted_risks,
      confirmed_at: confirmedAt,
    },
  });

  return {
    task_id: parsed.task_id,
    status,
    production_feedback_confirmation: confirmation,
    next_step: parsed.accepted
      ? "The accepted quote is locked. A mock payment link may now be created."
      : "Revise the order or request a new production quote.",
  };
}
