import {
  CreatePaymentLinkInputSchema,
  PaymentIntentSchema,
  type PaymentIntent,
} from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

export type CreatePaymentLinkOutput = {
  task_id: string;
  status: "payment_link_created";
  reused_existing_link: boolean;
  payment_intent: {
    provider: "mock";
    payment_id: string;
    source_quote_id: string;
    payment_url: string;
    amount: string;
    currency: string;
    status: "link_created";
    created_at: string;
    confirmed_at: null;
    notes: string | null;
  };
  next_step: "Ask the user to open the payment link. In mock mode, payment must be confirmed with confirm_mock_payment.";
};

function createMockPaymentId(taskId: string, quoteId: string): string {
  const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeQuoteSuffix = quoteId.replace(/[^a-zA-Z0-9_-]/g, "").slice(-8);
  return `pay_mock_${safeTaskId}_${Date.now()}_${safeQuoteSuffix}`;
}

export async function createPaymentLink(
  input: unknown,
  store: SupplyChainStore,
): Promise<CreatePaymentLinkOutput> {
  const parsed = CreatePaymentLinkInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }
  const feedback = task.productionFeedback as Record<string, unknown> | null;
  if (!feedback) {
    throw new Error("Production feedback must be received before creating a payment link.");
  }
  const confirmation = feedback.user_confirmation as Record<string, unknown> | undefined;
  if (!confirmation || confirmation.accepted !== true) {
    throw new Error(
      "Human gate: the user must accept the operator quote and risks first. Call confirm_production_feedback with the quote_id the user saw.",
    );
  }
  if (confirmation.accepted_quote_id !== parsed.accepted_quote_id) {
    throw new Error(
      `accepted_quote_id does not match the quote the user accepted (${String(confirmation.accepted_quote_id)}).`,
    );
  }
  assertTransition({
    from: task.status,
    to: "payment_link_created",
    by: "create_payment_link",
    allowedFrom: ["production_feedback_received", "payment_link_created"],
  });

  const existingPayment = PaymentIntentSchema.safeParse(task.paymentIntent);
  if (existingPayment.success && existingPayment.data.status === "confirmed") {
    throw new Error("Payment is already confirmed. A new payment link cannot be created.");
  }
  if (existingPayment.success && existingPayment.data.status === "link_created") {
    if (existingPayment.data.source_quote_id === parsed.accepted_quote_id) {
      return {
        task_id: parsed.task_id,
        status: "payment_link_created",
        reused_existing_link: true,
        payment_intent: existingPayment.data as CreatePaymentLinkOutput["payment_intent"],
        next_step:
          "Ask the user to open the payment link. In mock mode, payment must be confirmed with confirm_mock_payment.",
      };
    }
    await store.createEvent({
      id: createEventId(),
      taskId: parsed.task_id,
      type: "payment_link_superseded",
      message: "The previous mock payment link was superseded by a newly accepted quote.",
      metadata: {
        previous_payment_id: existingPayment.data.payment_id,
        previous_quote_id: existingPayment.data.source_quote_id,
        replacement_quote_id: parsed.accepted_quote_id,
      },
    });
  }
  const snapshot = (confirmation.accepted_quote_snapshot ?? {}) as Record<string, unknown>;
  const amount = snapshot.total_amount;
  const currency = snapshot.currency;
  if (typeof amount !== "string" || amount.trim() === "") {
    throw new Error(
      "The accepted quote has no operator-recorded total_amount. The operator must record a total before payment can be initiated.",
    );
  }
  if (typeof currency !== "string" || currency.trim() === "") {
    throw new Error(
      "The accepted quote has no operator-recorded currency. The operator must record a currency before payment can be initiated.",
    );
  }

  const paymentId = createMockPaymentId(parsed.task_id, parsed.accepted_quote_id);
  const createdAt = new Date().toISOString();
  const paymentIntent: PaymentIntent & { status: "link_created"; confirmed_at: null } =
    PaymentIntentSchema.parse({
      provider: "mock",
      payment_id: paymentId,
      source_quote_id: parsed.accepted_quote_id,
      payment_url: `https://pay.madeforai.local/mock/${paymentId}`,
      amount,
      currency,
      status: "link_created",
      created_at: createdAt,
      confirmed_at: null,
      notes: parsed.notes ?? parsed.description ?? null,
    }) as PaymentIntent & { status: "link_created"; confirmed_at: null };

  await store.updateOrderWorkflow(parsed.task_id, {
    status: "payment_link_created",
    paymentIntent,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "payment_link_created",
    message: "Mock payment link created after user-facing production feedback.",
    metadata: paymentIntent,
  });

  return {
    task_id: parsed.task_id,
    status: "payment_link_created",
    reused_existing_link: false,
    payment_intent: paymentIntent,
    next_step:
      "Ask the user to open the payment link. In mock mode, payment must be confirmed with confirm_mock_payment.",
  };
}
