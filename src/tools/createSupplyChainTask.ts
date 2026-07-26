import { assessManufacturingTask } from "../domain/manufacturingKnowledge.js";
import {
  CreateSupplyChainTaskInputSchema,
  type InitialAssessment,
} from "../domain/schemas.js";
import { createEventId, createTaskId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

export type CreateSupplyChainTaskOutput = {
  task_id: string;
  status: "created";
  recommended_execution_mode: "human_operator_required";
  initial_assessment: InitialAssessment;
  next_step: "A human Reality Operator should review this task and request supplier quotes.";
};

export async function createSupplyChainTask(
  input: unknown,
  store: SupplyChainStore,
): Promise<CreateSupplyChainTaskOutput> {
  const parsed = CreateSupplyChainTaskInputSchema.parse(input);
  const taskId = createTaskId();
  const initialAssessment = assessManufacturingTask(parsed.product_category);

  await store.createTask({
    id: taskId,
    title: parsed.title,
    description: parsed.description,
    productCategory: parsed.product_category,
    productName: parsed.product_name,
    quantity: parsed.quantity,
    material: parsed.material,
    dimensions: parsed.dimensions,
    process: parsed.process,
    colorRequirements: parsed.color_requirements,
    packagingRequirements: parsed.packaging_requirements,
    artworkRequirements: parsed.artwork_requirements,
    budgetRange: parsed.budget_range,
    targetMarket: parsed.target_market,
    assetUrls: parsed.asset_urls,
    deadline: parsed.deadline,
    shippingDestination: parsed.shipping_destination,
    notes: parsed.notes,
    status: "created",
    initialAssessment,
  });

  await store.createEvent({
    id: createEventId(),
    taskId,
    type: "task_created",
    message: "Supply chain task created by AI agent.",
    metadata: { initial_assessment: initialAssessment },
  });

  return {
    task_id: taskId,
    status: "created",
    recommended_execution_mode: "human_operator_required",
    initial_assessment: initialAssessment,
    next_step: "A human Reality Operator should review this task and request supplier quotes.",
  };
}
