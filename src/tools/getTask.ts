import { GetTaskInputSchema, InitialAssessmentSchema } from "../domain/schemas.js";
import type { SupplyChainStore } from "./store.js";

export type GetTaskOutput = {
  task_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  product_name?: string | null;
  quantity?: number | null;
  material?: string | null;
  dimensions?: string | null;
  process?: string | null;
  color_requirements?: string | null;
  packaging_requirements?: string | null;
  artwork_requirements?: string | null;
  budget_range?: string | null;
  target_market?: string | null;
  asset_urls?: unknown;
  deadline?: string | null;
  shipping_destination?: string | null;
  notes?: string | null;
  initial_assessment: unknown;
  quote_request: unknown;
  order_draft: unknown;
  user_confirmation: unknown;
  production_request: unknown;
  production_feedback: unknown;
  payment_intent: unknown;
  fulfillment: unknown;
  sample_result: unknown;
  history: Array<{
    id: string;
    type: string;
    message: string | null;
    metadata: unknown;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
};

export async function getTask(input: unknown, store: SupplyChainStore): Promise<GetTaskOutput> {
  const parsed = GetTaskInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }

  const initialAssessment = InitialAssessmentSchema.safeParse(task.initialAssessment);

  return {
    task_id: task.id,
    title: task.title,
    description: task.description,
    category: task.productCategory,
    status: task.status,
    product_name: task.productName,
    quantity: task.quantity,
    material: task.material,
    dimensions: task.dimensions,
    process: task.process,
    color_requirements: task.colorRequirements,
    packaging_requirements: task.packagingRequirements,
    artwork_requirements: task.artworkRequirements,
    budget_range: task.budgetRange,
    target_market: task.targetMarket,
    asset_urls: task.assetUrls,
    deadline: task.deadline,
    shipping_destination: task.shippingDestination,
    notes: task.notes,
    initial_assessment: initialAssessment.success ? initialAssessment.data : task.initialAssessment,
    quote_request: task.quoteRequest,
    order_draft: task.orderDraft,
    user_confirmation: task.userConfirmation,
    production_request: task.productionRequest,
    production_feedback: task.productionFeedback,
    payment_intent: task.paymentIntent,
    fulfillment: task.fulfillment,
    sample_result: task.sampleResults[0] ?? null,
    history: task.events.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      metadata: event.metadata,
      created_at: event.createdAt.toISOString(),
    })),
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
}
