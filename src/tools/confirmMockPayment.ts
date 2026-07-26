import { ConfirmMockPaymentInputSchema, PaymentIntentSchema } from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

export type ConfirmMockPaymentOutput = {
  task_id: string;
  status: "payment_confirmed" | "payment_link_created";
  payment_intent: unknown;
  next_step: string;
};

export async function confirmMockPayment(
  input: unknown,
  store: SupplyChainStore,
): Promise<ConfirmMockPaymentOutput> {
  const parsed = ConfirmMockPaymentInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }

  const paymentIntent = PaymentIntentSchema.safeParse(task.paymentIntent);
  if (!paymentIntent.success) {
    throw new Error("Payment link must be created before confirming mock payment.");
  }
  if (paymentIntent.data.payment_id !== parsed.payment_id) {
    throw new Error("Payment ID does not match the active payment intent.");
  }
  if (paymentIntent.data.status !== "link_created") {
    throw new Error("Only an active payment link can be confirmed.");
  }
  const feedback = task.productionFeedback as Record<string, unknown> | null;
  const confirmation = feedback?.user_confirmation as Record<string, unknown> | undefined;
  if (
    paymentIntent.data.source_quote_id !== feedback?.quote_id ||
    paymentIntent.data.source_quote_id !== confirmation?.accepted_quote_id
  ) {
    throw new Error(
      "Payment link is bound to a superseded quote. Ask the user to confirm the current quote and create a new link.",
    );
  }

  if (!parsed.confirmed) {
    await store.createEvent({
      id: createEventId(),
      taskId: parsed.task_id,
      type: "mock_payment_not_confirmed",
      message: parsed.message ?? "Mock payment confirmation was rejected.",
      metadata: { payment_id: parsed.payment_id, confirmed: false },
    });
    return {
      task_id: parsed.task_id,
      status: "payment_link_created",
      payment_intent: paymentIntent.data,
      next_step: "Payment remains pending. Ask the user to complete payment or cancel the task.",
    };
  }
  assertTransition({
    from: task.status,
    to: "payment_confirmed",
    by: "confirm_mock_payment",
    allowedFrom: ["payment_link_created"],
  });

  const confirmedPayment = {
    ...paymentIntent.data,
    status: "confirmed" as const,
    confirmed_at: new Date().toISOString(),
    notes: parsed.message ?? paymentIntent.data.notes,
  };

  await store.updateOrderWorkflow(parsed.task_id, {
    status: "payment_confirmed",
    paymentIntent: confirmedPayment,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "payment_confirmed",
    message: "Mock payment confirmed. Task can return to production side for execution.",
    metadata: confirmedPayment,
  });

  return {
    task_id: parsed.task_id,
    status: "payment_confirmed",
    payment_intent: confirmedPayment,
    next_step: "Production side should confirm paid order intake and continue execution.",
  };
}
