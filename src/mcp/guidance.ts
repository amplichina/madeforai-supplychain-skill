import { ZodError } from "zod";
import { assessOrderSanity } from "../domain/manufacturingKnowledge.js";
import type { ProductCategory } from "../domain/schemas.js";

export type GuidanceEnvelope = {
  audience: "ai_agent";
  status_summary: {
    en: string;
    zh: string;
  };
  waiting_for: "user" | "human_operator" | "payment_confirmation" | "production" | "none";
  suggested_next_tool: string | null;
  requires_explicit_user_confirmation: boolean;
  instruction: {
    en: string;
    zh: string;
  };
};

type JsonObject = Record<string, unknown>;

const FIELD_LABELS_ZH: Record<string, string> = {
  title: "任务标题",
  description: "需求说明",
  product_name: "产品名称",
  product_category: "产品类别",
  quantity: "数量",
  material: "材质",
  dimensions: "尺寸",
  process: "工艺",
  color_requirements: "颜色要求",
  packaging_requirements: "包装要求",
  artwork_requirements: "图稿要求",
  asset_urls: "素材链接",
  shipping_destination: "发货目的地",
  requested_budget_range: "预算范围",
  deadline: "交期",
  target_market: "目标市场",
};

function objectAt(value: unknown, key: string): JsonObject | undefined {
  if (!value || typeof value !== "object") return undefined;
  const nested = (value as JsonObject)[key];
  return nested && typeof nested === "object" ? (nested as JsonObject) : undefined;
}

function stringAt(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const nested = (value as JsonObject)[key];
  return typeof nested === "string" ? nested : undefined;
}

function baseGuidance(
  en: string,
  zh: string,
  waitingFor: GuidanceEnvelope["waiting_for"],
  suggestedNextTool: string | null,
  requiresConfirmation: boolean,
  instructionEn: string,
  instructionZh: string,
): GuidanceEnvelope {
  return {
    audience: "ai_agent",
    status_summary: { en, zh },
    waiting_for: waitingFor,
    suggested_next_tool: suggestedNextTool,
    requires_explicit_user_confirmation: requiresConfirmation,
    instruction: { en: instructionEn, zh: instructionZh },
  };
}

export type ConfirmationChecklistItem = {
  field: string;
  label: {
    en: string;
    zh: string;
  };
  value: unknown;
  requires_confirmation: true;
};

export function buildConfirmationChecklist(result: unknown): ConfirmationChecklistItem[] | undefined {
  const draft = objectAt(result, "order_draft");
  if (!draft) return undefined;

  const fields: Array<[string, string, string]> = [
    ["product_name", "Product", "产品名称"],
    ["quantity", "Quantity", "数量"],
    ["material", "Material", "材质"],
    ["dimensions", "Dimensions", "尺寸"],
    ["process", "Process", "工艺"],
    ["color_requirements", "Colors", "颜色要求"],
    ["packaging_requirements", "Packaging", "包装要求"],
    ["shipping_destination", "Ship to", "发货目的地"],
    ["requested_budget_range", "Budget", "预算范围"],
    ["deadline", "Deadline", "期望交期"],
  ];

  const checklist = fields
    .filter(([field]) => draft[field] !== undefined)
    .map(([field, en, zh]) => ({
      field,
      label: { en, zh },
      value: draft[field] ?? null,
      requires_confirmation: true as const,
    }));

  checklist.push({
    field: "price",
    label: { en: "Price", zh: "价格" },
    value: "Requires a human operator quote / 必须由人工操作员报价",
    requires_confirmation: true,
  });
  return checklist;
}

export function buildFeedbackNarration(result: unknown): {
  branch: "feasible" | "needs_clarification" | "not_feasible";
  instruction: { en: string; zh: string };
} | undefined {
  const feedback = objectAt(result, "production_feedback") ?? (result as JsonObject | undefined);
  if (!feedback || typeof feedback.feasible !== "boolean") return undefined;

  if (!feedback.feasible) {
    return {
      branch: "not_feasible",
      instruction: {
        en: "Explain why the current specification is not feasible, then offer to revise it. Do not create a payment link.",
        zh: "向用户说明当前规格不可生产的原因，并提出修改方案。不要生成支付链接。",
      },
    };
  }

  const clarifications = Array.isArray(feedback.required_clarifications)
    ? feedback.required_clarifications
    : [];
  if (clarifications.length > 0) {
    return {
      branch: "needs_clarification",
      instruction: {
        en: "Ask the returned clarification questions one at a time. Do not request payment until they are resolved and the user approves the updated terms.",
        zh: "逐条向用户询问生产端返回的澄清问题。问题解决且用户确认更新条件前，不要请求付款。",
      },
    };
  }

  return {
    branch: "feasible",
    instruction: {
      en: "Explain the human-confirmed quote, sample cost, lead time, and risks. Ask for explicit approval before creating a payment link.",
      zh: "向用户逐项说明人工确认的报价、打样费、交期和风险。得到明确同意后才能生成支付链接。",
    },
  };
}

function guidanceFor(toolName: string, result: JsonObject): GuidanceEnvelope | undefined {
  switch (toolName) {
    case "generate_artwork_brief":
      return baseGuidance(
        "The production artwork brief is ready.",
        "生产图稿指引已生成。",
        "user",
        "create_supplychain_task",
        false,
        "Walk the user through the checklist. Create the task only after the required artwork links and specifications are ready.",
        "带用户核对图稿清单；必要素材链接和规格准备好后再创建任务。",
      );
    case "create_supplychain_task":
      return baseGuidance(
        "The task is created and ready for human-operated sourcing.",
        "任务已创建，可进入人工询价。",
        "human_operator",
        "generate_quote_request",
        false,
        "Summarize the structured task to the user, then prepare the supplier quote request.",
        "向用户复述结构化任务，然后生成供应商询价单。",
      );
    case "generate_quote_request":
      return baseGuidance(
        "The supplier quote request is ready.",
        "供应商询价单已生成。",
        "human_operator",
        "generate_order_draft",
        false,
        "Route the Chinese request to the operator and prepare the user-facing order draft.",
        "将中文询价单交给生产操作员，同时准备用户侧订单草稿。",
      );
    case "quick_start_prototype_pipeline":
    case "generate_order_draft": {
      const draft = objectAt(result, "order_draft");
      const missing = Array.isArray(draft?.missing_requirements)
        ? draft.missing_requirements.filter((item): item is string => typeof item === "string")
        : [];
      if (draft?.production_readiness === "needs_user_input" || missing.length > 0) {
        return baseGuidance(
          `The draft still needs user input: ${missing.join(", ") || "missing specifications"}.`,
          `订单草稿仍需用户补充：${missing.map((field) => FIELD_LABELS_ZH[field] ?? field).join("、") || "缺失规格"}。`,
          "user",
          "generate_order_draft",
          false,
          "Ask for the missing specifications and regenerate the draft. Do not ask the user to confirm an incomplete draft.",
          "逐项询问缺失规格并重新生成草稿。不要让用户确认不完整的草稿。",
        );
      }
      return baseGuidance(
        "The order draft is ready for item-by-item user confirmation.",
        "订单草稿已可逐项向用户确认。",
        "user",
        "confirm_order_draft",
        true,
        "Present the confirmation checklist and obtain an explicit yes or no before recording the decision.",
        "展示确认清单，获得用户明确同意或拒绝后再记录决定。",
      );
    }
    case "confirm_order_draft":
      if (stringAt(result, "status") === "user_rejected") {
        return baseGuidance(
          "The user rejected the draft; nothing was sent to production.",
          "用户拒绝了草稿，任务未发送生产。",
          "user",
          "generate_order_draft",
          false,
          "Ask what needs to change, update the task, and regenerate the draft.",
          "询问需要修改的内容，更新任务后重新生成草稿。",
        );
      }
      return baseGuidance(
        "The user approved the draft and the production request is awaiting human review.",
        "用户已确认草稿，生产需求等待人工审核。",
        "human_operator",
        "get_task",
        false,
        "Tell the user that a human operator is checking feasibility, price, lead time, and risks.",
        "告知用户人工操作员正在核实可行性、价格、交期和风险。",
      );
    case "submit_production_feedback":
      return baseGuidance(
        "Human production feedback is ready for the user.",
        "人工生产反馈已可回传用户。",
        "user",
        "confirm_production_feedback",
        true,
        "Follow the narration branch. A payment link may only be created after the user explicitly accepts the quote and risks.",
        "按反馈分支向用户说明。只有用户明确接受报价和风险后，才能生成支付链接。",
      );
    case "confirm_production_feedback":
      if (stringAt(result, "status") === "user_rejected") {
        return baseGuidance(
          "The user rejected the operator quote or risks.",
          "用户拒绝了生产端报价或风险。",
          "user",
          "generate_order_draft",
          false,
          "Ask what should change, then revise the order or request a new operator quote.",
          "询问用户希望修改的内容，再调整订单或请求生产端重新报价。",
        );
      }
      return baseGuidance(
        "The user accepted the exact operator quote and risks.",
        "用户已确认本次生产端报价和风险。",
        "user",
        "create_payment_link",
        false,
        "Create the mock payment link using the accepted quote ID. Never supply or alter the amount yourself.",
        "使用已确认的报价编号创建模拟支付链接，不得自行提供或修改金额。",
      );
    case "create_payment_link":
      return baseGuidance(
        "A mock payment link is ready; this system does not process money.",
        "模拟支付链接已生成；本系统不处理真实资金。",
        "payment_confirmation",
        "confirm_mock_payment",
        false,
        "Share the link. Confirm payment only after a human or payment provider verifies it.",
        "将链接交给用户。只有人工或支付服务商核验后才能确认付款。",
      );
    case "confirm_mock_payment":
      return baseGuidance(
        "Payment is confirmed and production is unlocked.",
        "付款已确认，生产门槛已解锁。",
        "production",
        "update_production_status",
        false,
        "Tell the user production can begin and return future stage updates and evidence.",
        "告知用户可以开始生产，后续持续回传阶段进度和证据。",
      );
    case "update_production_status":
      return baseGuidance(
        "The production stage was updated.",
        "生产阶段已更新。",
        "production",
        "get_task",
        false,
        "Relay the current stage, notes, and available production photos to the user.",
        "向用户回传当前阶段、说明和已有生产照片。",
      );
    case "submit_shipment_info":
      return baseGuidance(
        "Shipment details are recorded.",
        "物流信息已记录。",
        "production",
        "complete_task",
        false,
        "Give the user the carrier, tracking number, and tracking link. Complete the task only after delivery.",
        "向用户提供承运商、物流单号和查询链接。签收后才能完成任务。",
      );
    case "complete_task":
      return baseGuidance(
        "The task is completed with delivery evidence.",
        "任务已完成并留存交付证据。",
        "none",
        null,
        false,
        "Close the loop with a concise delivery summary and the recorded proof.",
        "用简明交付总结和已记录凭证向用户完成收尾。",
      );
    case "upload_sample_result":
      return baseGuidance(
        "The sample result is recorded.",
        "样品结果已记录。",
        "user",
        "get_task",
        true,
        "Show the user the sample evidence, quote, and quality notes. Require approval before mass production.",
        "向用户展示样品证据、报价和质量说明，量产前必须获得确认。",
      );
    case "update_task_status":
      return baseGuidance(
        "The operator updated the task status.",
        "操作员已更新任务状态。",
        "human_operator",
        "get_task",
        false,
        "Fetch the complete task and explain the latest state to the user.",
        "查询完整任务并向用户解释最新状态。",
      );
    case "get_task": {
      const status = stringAt(result, "status") ?? "unknown";
      const stateGuidance: Record<
        string,
        {
          waitingFor: GuidanceEnvelope["waiting_for"];
          nextTool: string | null;
          requiresConfirmation: boolean;
        }
      > = {
        created: { waitingFor: "human_operator", nextTool: "generate_quote_request", requiresConfirmation: false },
        order_draft_created: { waitingFor: "user", nextTool: "confirm_order_draft", requiresConfirmation: true },
        production_requested: { waitingFor: "human_operator", nextTool: null, requiresConfirmation: false },
        payment_link_created: {
          waitingFor: "payment_confirmation",
          nextTool: "confirm_mock_payment",
          requiresConfirmation: false,
        },
        payment_confirmed: { waitingFor: "production", nextTool: "update_production_status", requiresConfirmation: false },
        production_ready: { waitingFor: "production", nextTool: null, requiresConfirmation: false },
        production_in_progress: { waitingFor: "production", nextTool: null, requiresConfirmation: false },
        quality_check: { waitingFor: "production", nextTool: "submit_shipment_info", requiresConfirmation: false },
        shipped: { waitingFor: "production", nextTool: "complete_task", requiresConfirmation: false },
        completed: { waitingFor: "none", nextTool: null, requiresConfirmation: false },
        cancelled: { waitingFor: "none", nextTool: null, requiresConfirmation: false },
      };
      if (status === "production_feedback_received") {
        const feedback = objectAt(result, "production_feedback");
        const confirmation = feedback ? objectAt(feedback, "user_confirmation") : undefined;
        const accepted = confirmation?.accepted === true;
        stateGuidance.production_feedback_received = {
          waitingFor: "user",
          nextTool: accepted ? "create_payment_link" : "confirm_production_feedback",
          requiresConfirmation: !accepted,
        };
      }
      const state = stateGuidance[status] ?? {
        waitingFor: "none" as const,
        nextTool: null,
        requiresConfirmation: false,
      };
      return baseGuidance(
        `Current task status: ${status}.`,
        `任务当前状态：${status}。`,
        state.waitingFor,
        state.nextTool,
        state.requiresConfirmation,
        "Summarize the latest records in the user's language. Respect the waiting party and do not invent missing values.",
        "使用用户语言概述最新记录，尊重当前等待方，不得编造缺失信息。",
      );
    }
    default:
      return undefined;
  }
}

export function attachGuidance(toolName: string, result: unknown, input?: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const enriched: JsonObject = { ...(result as JsonObject) };
  const guidance = guidanceFor(toolName, enriched);
  if (guidance) {
    const agentShouldPause = ["human_operator", "payment_confirmation", "production"].includes(
      guidance.waiting_for,
    );
    enriched.guidance = {
      ...guidance,
      agent_should_pause: agentShouldPause,
      ...(agentShouldPause
        ? {
            pause_instruction: {
              en: "Stop the automatic tool chain. Report the current status and wait for the responsible human side; use get_task later to check progress.",
              zh: "停止自动工具链，向用户汇报当前状态并等待对应人工环节；稍后使用 get_task 查询进展。",
            },
          }
        : {}),
    };
  }

  if (toolName === "generate_order_draft" || toolName === "quick_start_prototype_pipeline") {
    const checklist = buildConfirmationChecklist(enriched);
    if (checklist) enriched.confirmation_checklist = checklist;
  }
  if (toolName === "submit_production_feedback") {
    const narration = buildFeedbackNarration(enriched);
    if (narration) enriched.narration = narration;
  }
  if (
    toolName === "create_supplychain_task" ||
    toolName === "generate_order_draft" ||
    toolName === "quick_start_prototype_pipeline"
  ) {
    const inputObject =
      input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const nestedTask = objectAt(enriched, "task") ?? {};
    const draft = objectAt(enriched, "order_draft") ?? {};
    const source = { ...inputObject, ...nestedTask, ...draft };
    const category = source.product_category as ProductCategory | undefined;
    if (category) {
      const flags = assessOrderSanity(category, {
        quantity: source.quantity as number | null | undefined,
        process: source.process as string | null | undefined,
      });
      if (flags.length > 0) {
        enriched.sanity_check = {
          result: "needs_confirmation",
          flags,
          note: {
            en: "These are configurable heuristics, not rejections. Ask the user to confirm each item before proceeding.",
            zh: "这些是可配置的常识提示，不代表拒单。请逐项向用户确认后再推进。",
          },
        };
      }
    }
  }
  return enriched;
}

export function friendlyError(error: unknown): JsonObject {
  if (error instanceof ZodError) {
    const fields = error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
    const diagnostics = error.issues.map((issue) => ({
      field: issue.path.join(".") || "(root)",
      problem: issue.message,
      expected: "expected" in issue ? String(issue.expected) : issue.code,
      received: "received" in issue ? String(issue.received) : undefined,
      suggested_fix: `Provide a valid value for '${issue.path.join(".") || "input"}', then call the tool again.`,
    }));
    return {
      ok: false,
      error_code: "invalid_input",
      error: "The tool input is incomplete or invalid.",
      error_zh: "工具输入不完整或格式不正确。",
      fields,
      diagnostics,
      what_to_do: {
        en: "Ask the user for the listed fields in plain language, then call the tool again.",
        zh: `用自然语言向用户补问这些字段后重试：${fields.map((field) => FIELD_LABELS_ZH[field] ?? field).join("、")}。`,
      },
    };
  }

  const message = error instanceof Error ? error.message : "Unknown tool error";
  const taskNotFound = message.startsWith("Task not found:");
  return {
    ok: false,
    error_code: taskNotFound ? "task_not_found" : "invalid_task_state",
    error: message,
    what_to_do: {
      en: taskNotFound
        ? "Check the task ID with the user and call get_task again."
        : "Call get_task to inspect the current state, then follow its guidance and approval gates.",
      zh: taskNotFound
        ? "与用户核对任务编号后重新调用 get_task。"
        : "先调用 get_task 查看当前状态，再按照返回的指引和确认门槛推进。",
    },
  };
}
