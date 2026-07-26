import {
  GenerateOrderDraftInputSchema,
  OrderDraftSchema,
  type OrderDraft,
} from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore, TaskWithRelations } from "./store.js";

export type GenerateOrderDraftOutput = {
  task_id: string;
  user_language: "en" | "zh";
  order_draft: OrderDraft;
  user_confirmation_text: string;
  production_request_preview_zh: string;
  missing_requirements: string[];
  next_step: "Ask the user to confirm or revise this order draft before sending it to production.";
};

function assetUrlsFromTask(task: TaskWithRelations): string[] {
  if (Array.isArray(task.assetUrls)) {
    return task.assetUrls.filter((url): url is string => typeof url === "string");
  }
  return [];
}

function missingRequirements(task: TaskWithRelations): string[] {
  const missing: string[] = [];

  if (!task.quantity) missing.push("quantity");
  if (!task.material) missing.push("material");
  if (!task.dimensions) missing.push("dimensions");
  if (!task.process) missing.push("process");
  if (assetUrlsFromTask(task).length === 0) missing.push("production artwork or asset URLs");
  if (!task.shippingDestination) missing.push("shipping destination");

  return missing;
}

export function buildOrderDraft(
  task: TaskWithRelations,
  productionLocalization?: {
    production_title_zh?: string;
    production_description_zh?: string;
    production_spec_zh?: {
      material?: string;
      dimensions?: string;
      process?: string;
      color_requirements?: string;
      packaging_requirements?: string;
      artwork_requirements?: string;
      target_market?: string;
      shipping_destination?: string;
      requested_budget_range?: string;
      notes?: string;
    };
  },
): OrderDraft {
  const missing = missingRequirements(task);
  const draft = {
    product_name: task.productName ?? task.title,
    production_title_zh: productionLocalization?.production_title_zh ?? null,
    production_description_zh: productionLocalization?.production_description_zh ?? null,
    production_spec_zh: productionLocalization?.production_spec_zh
      ? {
          material: productionLocalization.production_spec_zh.material ?? null,
          dimensions: productionLocalization.production_spec_zh.dimensions ?? null,
          process: productionLocalization.production_spec_zh.process ?? null,
          color_requirements: productionLocalization.production_spec_zh.color_requirements ?? null,
          packaging_requirements:
            productionLocalization.production_spec_zh.packaging_requirements ?? null,
          artwork_requirements:
            productionLocalization.production_spec_zh.artwork_requirements ?? null,
          target_market: productionLocalization.production_spec_zh.target_market ?? null,
          shipping_destination:
            productionLocalization.production_spec_zh.shipping_destination ?? null,
          requested_budget_range:
            productionLocalization.production_spec_zh.requested_budget_range ?? null,
          notes: productionLocalization.production_spec_zh.notes ?? null,
        }
      : null,
    product_category: task.productCategory,
    quantity: task.quantity,
    material: task.material,
    dimensions: task.dimensions,
    process: task.process,
    color_requirements: task.colorRequirements,
    packaging_requirements: task.packagingRequirements,
    artwork_requirements: task.artworkRequirements,
    asset_urls: assetUrlsFromTask(task),
    target_market: task.targetMarket,
    shipping_destination: task.shippingDestination,
    requested_budget_range: task.budgetRange,
    deadline: task.deadline,
    notes: task.notes,
    price: {
      status: "requires_human_confirmation" as const,
      quoted_price: null,
      currency: null,
    },
    production_readiness: missing.length > 0 ? "needs_user_input" : "needs_operator_review",
    missing_requirements: missing,
    confirmation_status: "draft" as const,
  };

  return OrderDraftSchema.parse(draft);
}

function valueOrMissing(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Not provided";
  return String(value);
}

function valueOrPendingZh(value: unknown): string {
  if (value === undefined || value === null || value === "") return "待确认";
  if (Array.isArray(value)) return value.length > 0 ? value.join("，") : "待确认";
  return String(value);
}

const CATEGORY_NAMES_ZH: Record<OrderDraft["product_category"], string> = {
  badge: "徽章",
  acrylic: "亚克力制品",
  card: "卡片",
  packaging_card: "包装卡",
  sticker: "贴纸",
  print_collateral: "宣传印刷品",
  exhibition_display: "展会与门店物料",
  apparel: "服装与工服",
  small_batch_merch: "小批量周边",
  other: "其他定制品",
};

function buildUserConfirmationText(draft: OrderDraft, language: "en" | "zh"): string {
  if (language === "zh") {
    return [
      "请确认以下订单草稿。确认后，MadeForAI 会把中文生产需求单发送给人工 Reality Operator 审核。",
      `产品名称：${draft.product_name}`,
      `产品类别：${CATEGORY_NAMES_ZH[draft.product_category]}`,
      `数量：${valueOrPendingZh(draft.quantity)}`,
      `材质：${valueOrPendingZh(draft.material)}`,
      `尺寸：${valueOrPendingZh(draft.dimensions)}`,
      `工艺：${valueOrPendingZh(draft.process)}`,
      `颜色要求：${valueOrPendingZh(draft.color_requirements)}`,
      `包装要求：${valueOrPendingZh(draft.packaging_requirements)}`,
      `图稿要求：${valueOrPendingZh(draft.artwork_requirements)}`,
      `目标市场：${valueOrPendingZh(draft.target_market)}`,
      `发货目的地：${valueOrPendingZh(draft.shipping_destination)}`,
      "价格状态：需要人工确认。当前不会自动下单或付款。",
    ].join("\n");
  }

  return [
    "Please confirm this order draft. After confirmation, MadeForAI will send a Chinese production request to a human Reality Operator for review.",
    `Product name: ${draft.product_name}`,
    `Product category: ${draft.product_category}`,
    `Quantity: ${valueOrMissing(draft.quantity)}`,
    `Material: ${valueOrMissing(draft.material)}`,
    `Dimensions: ${valueOrMissing(draft.dimensions)}`,
    `Process: ${valueOrMissing(draft.process)}`,
    `Color requirements: ${valueOrMissing(draft.color_requirements)}`,
    `Packaging requirements: ${valueOrMissing(draft.packaging_requirements)}`,
    `Artwork requirements: ${valueOrMissing(draft.artwork_requirements)}`,
    `Target market: ${valueOrMissing(draft.target_market)}`,
    `Shipping destination: ${valueOrMissing(draft.shipping_destination)}`,
    "Price status: requires human confirmation. No order or payment will be placed automatically.",
  ].join("\n");
}

export function buildProductionRequestTextZh(draft: OrderDraft): string {
  return [
    "生产需求单（人工 Reality Operator 审核）",
    `生产任务标题：${valueOrPendingZh(draft.production_title_zh)}`,
    `需求说明：${valueOrPendingZh(draft.production_description_zh)}`,
    `产品名称：${valueOrPendingZh(draft.production_title_zh)}`,
    `产品类别：${CATEGORY_NAMES_ZH[draft.product_category]}`,
    `数量：${valueOrPendingZh(draft.quantity)}`,
    `材质：${valueOrPendingZh(draft.production_spec_zh?.material)}`,
    `尺寸：${valueOrPendingZh(draft.production_spec_zh?.dimensions)}`,
    `工艺：${valueOrPendingZh(draft.production_spec_zh?.process)}`,
    `颜色要求：${valueOrPendingZh(draft.production_spec_zh?.color_requirements)}`,
    `包装要求：${valueOrPendingZh(draft.production_spec_zh?.packaging_requirements)}`,
    `图稿/素材要求：${valueOrPendingZh(draft.production_spec_zh?.artwork_requirements)}`,
    `素材链接：${valueOrPendingZh(draft.asset_urls)}`,
    `目标市场：${valueOrPendingZh(draft.production_spec_zh?.target_market)}`,
    `发货目的地：${valueOrPendingZh(draft.production_spec_zh?.shipping_destination)}`,
    `预算范围：${valueOrPendingZh(draft.production_spec_zh?.requested_budget_range)}`,
    `期望截止时间：${valueOrPendingZh(draft.deadline)}`,
    `备注：${valueOrPendingZh(draft.production_spec_zh?.notes)}`,
    "请人工确认：是否可生产、建议工艺、MOQ、打样费、单价、生产周期、物流方案、质量风险和需要用户补充的信息。",
    "注意：价格必须人工确认。本需求单不代表自动下单或付款。",
  ].join("\n");
}

export async function generateOrderDraft(
  input: unknown,
  store: SupplyChainStore,
): Promise<GenerateOrderDraftOutput> {
  const parsed = GenerateOrderDraftInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }
  assertTransition({
    from: task.status,
    to: "order_draft_created",
    by: "generate_order_draft",
    allowedFrom: ["created", "quote_received", "user_rejected", "order_draft_created"],
  });

  const orderDraft = buildOrderDraft(task, parsed);
  const userLanguage = parsed.user_language === "zh" ? "zh" : "en";
  const userConfirmationText = buildUserConfirmationText(orderDraft, userLanguage);
  const productionRequestPreviewZh = buildProductionRequestTextZh(orderDraft);
  await store.updateOrderWorkflow(parsed.task_id, {
    status: "order_draft_created",
    orderDraft,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "order_draft_generated",
    message: "Order draft generated for user confirmation.",
    metadata: {
      missing_requirements: orderDraft.missing_requirements,
      production_readiness: orderDraft.production_readiness,
    },
  });

  return {
    task_id: parsed.task_id,
    user_language: userLanguage,
    order_draft: orderDraft,
    user_confirmation_text: userConfirmationText,
    production_request_preview_zh: productionRequestPreviewZh,
    missing_requirements: orderDraft.missing_requirements,
    next_step:
      "Ask the user to confirm or revise this order draft before sending it to production.",
  };
}
