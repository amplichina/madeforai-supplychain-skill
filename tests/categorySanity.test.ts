import { describe, expect, it } from "vitest";
import { assessOrderSanity } from "../src/domain/categorySanity.js";
import { attachGuidance } from "../src/mcp/guidance.js";
import { quickStartPrototypePipeline } from "../src/tools/quickStartPrototype.js";
import { createInMemoryStore } from "./inMemoryStore.js";
import { deriveCategoryObservations } from "../src/domain/categoryObservations.js";

describe("manufacturing sanity guard", () => {
  it("flags unusually high category quantity without rejecting it", () => {
    const flags = assessOrderSanity("badge", { quantity: 100_000 });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ field: "quantity" });
    expect(flags[0].concern.zh).toContain("参考区间");
  });

  it("flags below-range quantity as a clarification", () => {
    const flags = assessOrderSanity("card", { quantity: 3 });
    expect(flags).toHaveLength(1);
    expect(flags[0].concern.en).toContain("Ask whether");
  });

  it("flags a category-incompatible process keyword", () => {
    const flags = assessOrderSanity("acrylic", {
      quantity: 500,
      process: "表面电镀处理",
    });
    expect(flags.some((flag) => flag.field === "process")).toBe(true);
  });

  it("stays silent for a typical order", () => {
    expect(assessOrderSanity("badge", { quantity: 500, process: "soft enamel" })).toHaveLength(0);
  });

  it("attaches the sanity result to AI guidance", () => {
    const result = attachGuidance(
      "create_supplychain_task",
      {
        task_id: "task_demo",
        product_category: "badge",
        quantity: 100_000,
      },
      {
        product_category: "badge",
        quantity: 100_000,
      },
    ) as Record<string, unknown>;

    expect(result.sanity_check).toMatchObject({
      result: "needs_confirmation",
      flags: [expect.objectContaining({ field: "quantity" })],
    });
  });

  it("does not attach a sanity warning to a typical order", () => {
    const result = attachGuidance(
      "create_supplychain_task",
      {
        task_id: "task_typical",
        product_category: "badge",
        quantity: 300,
      },
      {
        product_category: "badge",
        quantity: 300,
      },
    ) as Record<string, unknown>;

    expect(result.sanity_check).toBeUndefined();
  });
});

describe("privacy-safe category observations", () => {
  it("returns only aggregate coverage from completed tasks", () => {
    const completed = {
      productCategory: "badge",
      status: "completed",
      quantity: 200,
      productionFeedback: {
        total_amount: "1960.00",
        estimated_production_time: "12-15 days",
      },
    } as never;
    const result = deriveCategoryObservations([completed], "badge");

    expect(result).toMatchObject({
      completed_orders_seen: 1,
      orders_with_operator_quote: 1,
      orders_with_recorded_lead_time: 1,
      quantity_range_seen: { min: 200, max: 200 },
    });
    expect(result).not.toHaveProperty("observed_quotes");
    expect(result).not.toHaveProperty("observed_production_times");
  });

  it("does not expose observations from unfinished tasks", () => {
    const unfinished = {
      productCategory: "badge",
      status: "production_feedback_received",
      quantity: 200,
      productionFeedback: { total_amount: "1960.00" },
    } as never;

    expect(deriveCategoryObservations([unfinished], "badge")).toBeUndefined();
  });
});

describe("safe prototype macro and pause semantics", () => {
  it("creates a task and draft but stops before user confirmation", async () => {
    const store = createInMemoryStore();
    const result = await quickStartPrototypePipeline(
      {
        title: "Cyberpunk bottle opener",
        description: "A zinc alloy bottle opener for a competition prototype.",
        product_category: "small_batch_merch",
        product_name: "Cyberpunk bottle opener",
        quantity: 500,
        material: "zinc alloy",
        process: "die casting and surface finishing",
        shipping_destination: "Shanghai, China",
      },
      store,
    );

    expect(result).toMatchObject({
      pipeline: ["create_supplychain_task", "generate_order_draft"],
      stopped_before: "confirm_order_draft",
      order_draft: expect.objectContaining({ quantity: 500 }),
    });
    const task = await store.getTask(result.task_id as string);
    expect(task?.status).toBe("order_draft_created");
    expect(task?.productionRequest).toBeNull();
  });

  it("tells an AI to pause while a human operator is responsible", () => {
    const result = attachGuidance("confirm_order_draft", {
      status: "production_request_created",
    }) as { guidance: { agent_should_pause: boolean; pause_instruction: { zh: string } } };

    expect(result.guidance.agent_should_pause).toBe(true);
    expect(result.guidance.pause_instruction.zh).toContain("停止自动工具链");
  });

  it("derives pause behavior from the current task status", () => {
    const result = attachGuidance("get_task", {
      status: "production_in_progress",
    }) as { guidance: { waiting_for: string; agent_should_pause: boolean } };

    expect(result.guidance).toMatchObject({
      waiting_for: "production",
      agent_should_pause: true,
    });
  });
});

describe("phase 1 categories: corporate identity and high-frequency custom goods", () => {
  it("covers every phase-1 category with knowledge and sanity data", async () => {
    const { KNOWLEDGE_BASE } = await import("../src/domain/manufacturingKnowledge.js");
    const categories = [
      "print_collateral",
      "exhibition_display",
      "apparel",
      "badge",
      "acrylic",
      "card",
      "packaging_card",
      "sticker",
      "small_batch_merch",
    ] as const;

    for (const category of categories) {
      const entry = KNOWLEDGE_BASE[category];
      expect(entry.likelyProcesses.length).toBeGreaterThan(0);
      expect(entry.keyRisks.length).toBeGreaterThan(0);
      expect(entry.questionsForUser.length).toBeGreaterThan(0);
      expect(entry.sanity.typicalQuantity.max).toBeGreaterThan(entry.sanity.typicalQuantity.min);
    }
  });

  it("flags unusual print quantities and incompatible processes without rejecting the task", () => {
    expect(assessOrderSanity("print_collateral", { quantity: 900_000 })).toHaveLength(1);
    expect(assessOrderSanity("print_collateral", { quantity: 500, process: "电镀" })).toHaveLength(
      1,
    );
    expect(
      assessOrderSanity("print_collateral", {
        quantity: 500,
        process: "offset printing",
      }),
    ).toHaveLength(0);
  });

  it("treats a single exhibition backdrop as a normal quantity", () => {
    expect(assessOrderSanity("exhibition_display", { quantity: 1 })).toHaveLength(0);
  });

  it("asks for MOQ clarification on a five-piece apparel request", () => {
    const flags = assessOrderSanity("apparel", { quantity: 5 });
    expect(flags).toHaveLength(1);
    expect(flags[0].concern.zh).toContain("起订");
  });
});
