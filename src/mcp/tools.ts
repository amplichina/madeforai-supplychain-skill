import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { attachGuidance, friendlyError } from "./guidance.js";
import { deriveCategoryObservations } from "../domain/categoryObservations.js";
import {
  CreateSupplyChainTaskInputSchema,
  ConfirmOrderDraftInputSchema,
  ConfirmMockPaymentInputSchema,
  ConfirmProductionFeedbackInputSchema,
  CreatePaymentLinkInputSchema,
  CompleteTaskInputSchema,
  GenerateArtworkBriefInputSchema,
  GenerateQuoteRequestInputSchema,
  GenerateOrderDraftInputSchema,
  GetTaskInputSchema,
  SubmitShipmentInfoInputSchema,
  SubmitProductionFeedbackInputShape,
  UpdateProductionStatusInputSchema,
  UpdateTaskStatusInputSchema,
  UploadSampleResultInputSchema,
} from "../domain/schemas.js";
import {
  confirmOrderDraft,
  confirmMockPayment,
  confirmProductionFeedback,
  completeTask,
  createPaymentLink,
  createSupplyChainTask,
  generateArtworkBrief,
  generateOrderDraft,
  generateQuoteRequest,
  getTask,
  submitProductionFeedback,
  submitShipmentInfo,
  updateProductionStatus,
  updateTaskStatus,
  uploadSampleResult,
  quickStartPrototypePipeline,
  type SupplyChainStore,
} from "../tools/index.js";

function jsonResponse(value: unknown, isError = false) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
    ...(isError ? { isError: true as const } : {}),
  };
}

async function guided(toolName: string, run: () => Promise<unknown>, input?: unknown) {
  try {
    return jsonResponse(attachGuidance(toolName, await run(), input));
  } catch (error) {
    return jsonResponse(friendlyError(error), true);
  }
}

async function guidedWithObservations(
  toolName: string,
  run: () => Promise<unknown>,
  store: SupplyChainStore,
  input?: unknown,
) {
  try {
    const result = await run();
    const inputObject =
      input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const resultObject =
      result && typeof result === "object" ? (result as Record<string, unknown>) : {};
    const task =
      resultObject.task && typeof resultObject.task === "object"
        ? (resultObject.task as Record<string, unknown>)
        : {};
    const draft =
      resultObject.order_draft && typeof resultObject.order_draft === "object"
        ? (resultObject.order_draft as Record<string, unknown>)
        : {};
    const category =
      inputObject.product_category ?? task.product_category ?? draft.product_category;
    const enriched =
      typeof category === "string"
        ? {
            ...resultObject,
            category_observations: deriveCategoryObservations(await store.listTasks(), category),
          }
        : result;
    return jsonResponse(attachGuidance(toolName, enriched, input));
  } catch (error) {
    return jsonResponse(friendlyError(error), true);
  }
}

export function registerSupplyChainTools(server: McpServer, store: SupplyChainStore): void {
  server.tool(
    "create_supplychain_task",
    "Create a human-executed reality supply chain task from an AI manufacturing request.",
    CreateSupplyChainTaskInputSchema.shape,
    async (input) =>
      guidedWithObservations(
        "create_supplychain_task",
        () => createSupplyChainTask(input, store),
        store,
        input,
      ),
  );

  server.tool(
    "generate_artwork_brief",
    "Guide the user's own AI agent or designer to prepare production-ready artwork before task submission. User-facing output defaults to English and does not generate images.",
    GenerateArtworkBriefInputSchema.shape,
    async (input) => guided("generate_artwork_brief", () => generateArtworkBrief(input), input),
  );

  server.tool(
    "generate_quote_request",
    "Generate a quote request. Chinese is intended for production-side suppliers and Reality Operators; English is intended for the user's AI interface.",
    GenerateQuoteRequestInputSchema.shape,
    async (input) =>
      guided("generate_quote_request", () => generateQuoteRequest(input, store), input),
  );

  server.tool(
    "generate_order_draft",
    "Generate a structured user-confirmable order draft. User-facing text defaults to English. Supply production_title_zh, production_description_zh, and production_spec_zh so the production workspace remains Chinese.",
    GenerateOrderDraftInputSchema.shape,
    async (input) =>
      guidedWithObservations(
        "generate_order_draft",
        () => generateOrderDraft(input, store),
        store,
        input,
      ),
  );

  server.tool(
    "confirm_order_draft",
    "Record user confirmation or rejection of an order draft and create a production request after confirmation.",
    ConfirmOrderDraftInputSchema.shape,
    async (input) => guided("confirm_order_draft", () => confirmOrderDraft(input, store), input),
  );

  server.tool(
    "submit_production_feedback",
    "Let the production side submit feasibility, quote, lead time, clarification, and risk feedback.",
    SubmitProductionFeedbackInputShape,
    async (input) =>
      guided("submit_production_feedback", () => submitProductionFeedback(input, store), input),
  );

  server.tool(
    "confirm_production_feedback",
    "Record the user's explicit acceptance or rejection of the current operator quote and risks before payment.",
    ConfirmProductionFeedbackInputSchema.shape,
    async (input) =>
      guided("confirm_production_feedback", () => confirmProductionFeedback(input, store), input),
  );

  server.tool(
    "create_payment_link",
    "Create a mock payment link after production feedback and user approval. Does not process real payments.",
    CreatePaymentLinkInputSchema.shape,
    async (input) => guided("create_payment_link", () => createPaymentLink(input, store), input),
  );

  server.tool(
    "confirm_mock_payment",
    "Confirm or reject a mock payment. This simulates payment provider webhook/manual confirmation.",
    ConfirmMockPaymentInputSchema.shape,
    async (input) => guided("confirm_mock_payment", () => confirmMockPayment(input, store), input),
  );

  server.tool(
    "update_production_status",
    "Update paid-order production progress, including production-ready, in-progress, and quality-check stages.",
    UpdateProductionStatusInputSchema.shape,
    async (input) =>
      guided("update_production_status", () => updateProductionStatus(input, store), input),
  );

  server.tool(
    "submit_shipment_info",
    "Submit shipment carrier, tracking number, tracking URL, and shipping notes after production.",
    SubmitShipmentInfoInputSchema.shape,
    async (input) => guided("submit_shipment_info", () => submitShipmentInfo(input, store), input),
  );

  server.tool(
    "complete_task",
    "Mark a paid and fulfilled task as completed with final delivery notes and proof URLs.",
    CompleteTaskInputSchema.shape,
    async (input) => guided("complete_task", () => completeTask(input, store), input),
  );

  server.tool(
    "update_task_status",
    "Update the status of a supply chain task after human Reality Operator review.",
    UpdateTaskStatusInputSchema.shape,
    async (input) => guided("update_task_status", () => updateTaskStatus(input, store), input),
  );

  server.tool(
    "upload_sample_result",
    "Upload sample photos, videos, quote details, production timing, and supplier feedback.",
    UploadSampleResultInputSchema.shape,
    async (input) => guided("upload_sample_result", () => uploadSampleResult(input, store), input),
  );

  server.tool(
    "quick_start_prototype_pipeline",
    "Create a supply chain task and its order draft in one safe pre-confirmation call. It always stops before user confirmation and cannot trigger payment or real-world execution.",
    CreateSupplyChainTaskInputSchema.shape,
    async (input) =>
      guidedWithObservations(
        "quick_start_prototype_pipeline",
        () => quickStartPrototypePipeline(input, store),
        store,
        input,
      ),
  );

  server.tool(
    "get_task",
    "Return complete task information, status history, quote request, and sample result.",
    GetTaskInputSchema.shape,
    async (input) => guided("get_task", () => getTask(input, store), input),
  );
}
