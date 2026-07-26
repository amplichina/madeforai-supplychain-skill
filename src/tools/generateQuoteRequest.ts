import { GenerateQuoteRequestInputSchema } from "../domain/schemas.js";
import { createEventId } from "../utils/ids.js";
import type { SupplyChainStore, TaskWithRelations } from "./store.js";

export type GenerateQuoteRequestOutput = {
  task_id: string;
  language: "en" | "zh";
  intended_audience: "ai_user_interface" | "production_side";
  quote_request_text: string;
  supplier_checklist: string[];
  operator_notes: string[];
};

function formatOptional(label: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;
  return `${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`;
}

function buildChineseQuoteRequest(task: TaskWithRelations): string {
  const lines = [
    "你好，我们需要人工确认以下小批量定制生产需求，请协助评估是否可做并提供报价。",
    formatOptional("任务编号", task.id),
    formatOptional("产品类别", task.productCategory),
    formatOptional("产品名称", task.productName),
    formatOptional("需求标题", task.title),
    formatOptional("需求说明", task.description),
    formatOptional("数量", task.quantity),
    formatOptional("材质", task.material),
    formatOptional("尺寸", task.dimensions),
    formatOptional("工艺", task.process),
    formatOptional("颜色要求", task.colorRequirements),
    formatOptional("包装要求", task.packagingRequirements),
    formatOptional("图稿要求", task.artworkRequirements),
    formatOptional("预算范围", task.budgetRange),
    formatOptional("目标市场", task.targetMarket),
    formatOptional("素材链接", task.assetUrls),
    formatOptional("期望截止时间", task.deadline),
    formatOptional("发货目的地", task.shippingDestination),
    formatOptional("备注", task.notes),
    "请确认：工艺方案、可做数量/MOQ、打样费用、单价、生产周期、包装方式、发货方式和潜在风险。",
    "价格需要人工确认，本请求不代表自动下单或付款。",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildEnglishQuoteRequest(task: TaskWithRelations): string {
  const lines = [
    "Please manually review this small-batch manufacturing request and provide a supplier quote.",
    formatOptional("Task ID", task.id),
    formatOptional("Product category", task.productCategory),
    formatOptional("Product name", task.productName),
    formatOptional("Title", task.title),
    formatOptional("Description", task.description),
    formatOptional("Quantity", task.quantity),
    formatOptional("Material", task.material),
    formatOptional("Dimensions", task.dimensions),
    formatOptional("Process", task.process),
    formatOptional("Color requirements", task.colorRequirements),
    formatOptional("Packaging requirements", task.packagingRequirements),
    formatOptional("Artwork requirements", task.artworkRequirements),
    formatOptional("Budget range", task.budgetRange),
    formatOptional("Target market", task.targetMarket),
    formatOptional("Asset URLs", task.assetUrls),
    formatOptional("Deadline", task.deadline),
    formatOptional("Shipping destination", task.shippingDestination),
    formatOptional("Notes", task.notes),
    "Please confirm process, feasibility, MOQ, sample cost, unit price, production lead time, packaging, shipping options, and risks.",
    "Pricing must be manually confirmed. This request does not place an order or process payment.",
  ];

  return lines.filter(Boolean).join("\n");
}

export async function generateQuoteRequest(
  input: unknown,
  store: SupplyChainStore,
): Promise<GenerateQuoteRequestOutput> {
  const parsed = GenerateQuoteRequestInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }

  const quoteRequestText =
    parsed.language === "zh" ? buildChineseQuoteRequest(task) : buildEnglishQuoteRequest(task);
  const supplierChecklist =
    parsed.language === "zh"
      ? [
          "确认工艺可行性",
          "确认 MOQ 和小批量报价",
          "确认打样费用和周期",
          "确认包装和物流方式",
          "列出质量风险",
        ]
      : [
          "Confirm process feasibility",
          "Confirm MOQ and small-batch pricing",
          "Confirm sample cost and lead time",
          "Confirm packaging and shipping options",
          "List quality risks",
        ];
  const operatorNotes =
    parsed.language === "zh"
      ? [
          "不要承诺价格，所有价格需要人工核实。",
          "不要自动下单或支付。",
          "需要样品照片、视频或工艺反馈时再上传结果。",
        ]
      : [
          "Do not promise pricing before manual confirmation.",
          "Do not place orders or process payments automatically.",
          "Upload sample photos, videos, or process feedback after human execution.",
        ];

  await store.updateQuoteRequest(parsed.task_id, {
    language: parsed.language,
    text: quoteRequestText,
    supplier_checklist: supplierChecklist,
  });
  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "quote_request_generated",
    message: `Quote request generated in ${parsed.language}.`,
    metadata: { language: parsed.language, supplier_checklist: supplierChecklist },
  });

  return {
    task_id: parsed.task_id,
    language: parsed.language,
    intended_audience: parsed.language === "zh" ? "production_side" : "ai_user_interface",
    quote_request_text: quoteRequestText,
    supplier_checklist: supplierChecklist,
    operator_notes: operatorNotes,
  };
}
