import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  attachGuidance,
  buildConfirmationChecklist,
  buildFeedbackNarration,
  friendlyError,
} from "../src/mcp/guidance.js";

describe("MCP AI guidance", () => {
  it("adds a structured confirmation checklist without inventing a price", () => {
    const checklist = buildConfirmationChecklist({
      order_draft: {
        product_name: "Waterproof sticker pack",
        quantity: 500,
        material: "waterproof vinyl",
        process: "printing, kiss cutting, matte lamination",
      },
    });

    expect(checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "quantity", value: 500 }),
        expect.objectContaining({
          field: "price",
          value: expect.stringContaining("human operator"),
        }),
      ]),
    );
  });

  it("keeps an incomplete draft away from the confirmation step", () => {
    const result = attachGuidance("generate_order_draft", {
      order_draft: {
        production_readiness: "needs_user_input",
        missing_requirements: ["material", "dimensions"],
      },
    }) as {
      guidance: {
        suggested_next_tool: string;
        requires_explicit_user_confirmation: boolean;
        waiting_for: string;
      };
    };

    expect(result.guidance).toMatchObject({
      suggested_next_tool: "generate_order_draft",
      requires_explicit_user_confirmation: false,
      waiting_for: "user",
    });
  });

  it("requires explicit quote approval before a payment link", () => {
    const narration = buildFeedbackNarration({
      production_feedback: {
        feasible: true,
        quote: "RMB 600",
        required_clarifications: [],
      },
    });

    expect(narration).toMatchObject({ branch: "feasible" });
    expect(narration?.instruction.en).toContain("explicit approval");
  });

  it("returns actionable structured validation errors", () => {
    const schema = z.object({ task_id: z.string().min(8), quantity: z.number().positive() });
    const parsed = schema.safeParse({ task_id: "bad" });
    if (parsed.success) throw new Error("Expected validation to fail");

    expect(friendlyError(parsed.error)).toMatchObject({
      ok: false,
      error_code: "invalid_input",
      fields: expect.arrayContaining(["task_id", "quantity"]),
      what_to_do: {
        en: expect.stringContaining("listed fields"),
      },
    });
  });
});
