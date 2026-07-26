import { describe, expect, it } from "vitest";
import { createInMemoryStore } from "./inMemoryStore.js";
import {
  createSupplyChainTask,
  confirmOrderDraft,
  confirmProductionFeedback,
  confirmMockPayment,
  completeTask,
  createPaymentLink,
  generateArtworkBrief,
  generateOrderDraft,
  generateQuoteRequest,
  getTask,
  submitProductionFeedback,
  submitShipmentInfo,
  updateTaskStatus,
  updateProductionStatus,
  uploadSampleResult,
} from "../src/tools/index.js";

const baseBadgeInput = {
  title: "Custom enamel pins for launch box",
  description: "Small batch badge production with brand artwork and retail packaging.",
  product_category: "badge" as const,
  product_name: "Launch box enamel badge",
  quantity: 200,
  material: "zinc alloy",
  dimensions: "30mm width, 2mm thickness",
  process: "hard enamel with gold electroplating",
  color_requirements: "match brand Pantone colors where feasible",
  packaging_requirements: "individual opp bag with backing card",
  artwork_requirements: "production-ready vector artwork required",
  budget_range: "manual quote required",
  target_market: "US",
  asset_urls: ["https://example.com/artwork.png"],
  shipping_destination: "Los Angeles, CA",
};

describe("MadeForAI supply chain tools", () => {
  it("generate_artwork_brief guides user-owned artwork preparation without image generation", async () => {
    const result = await generateArtworkBrief({
      product_category: "acrylic",
      product_name: "Acrylic character stand",
      manufacturing_goal: "Prepare printable artwork before submitting a production task.",
      quantity: 100,
      target_market: "Japan",
      language: "en",
    });

    expect(result.brief_text).toContain("Use your own AI tool or designer");
    expect(result.user_language).toBe("en");
    expect(result.production_artwork_checklist).toContain(
      "Cut line path showing final acrylic shape",
    );
    expect(result.safety_boundaries).toContain("MadeForAI does not generate artwork or images.");
    expect(result.next_step).toContain("create_supplychain_task");
  });

  it("generates bilingual production artwork requirements for the new phase-1 categories", async () => {
    const cases = [
      ["print_collateral", "3mm 出血"],
      ["exhibition_display", "大幅面图稿"],
      ["apparel", "印花或刺绣"],
    ] as const;

    for (const [productCategory, expectedRequirement] of cases) {
      const result = await generateArtworkBrief({
        product_category: productCategory,
        product_name: "企业定制物料",
        language: "zh",
      });

      expect(result.user_language).toBe("zh");
      expect(result.production_artwork_checklist.join("\n")).toContain(expectedRequirement);
      expect(result.safety_boundaries.join("\n")).toContain("不生成图片");
    }
  });

  it("renders a Chinese production category name for print collateral", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(
      {
        title: "Annual brand collateral refresh",
        description: "Business cards and presentation folders for the new brand system.",
        product_category: "print_collateral",
        product_name: "Brand collateral set",
        quantity: 500,
        material: "350gsm coated paper",
        dimensions: "90mm x 54mm business cards and A4 folders",
        process: "offset printing with spot UV",
        asset_urls: ["https://example.com/brand-collateral.pdf"],
        shipping_destination: "Shanghai",
      },
      store,
    );

    const draft = await generateOrderDraft(
      {
        task_id: task.task_id,
        user_language: "zh",
        production_title_zh: "企业品牌宣传印刷品",
        production_description_zh: "制作名片与文件夹套装。",
      },
      store,
    );

    expect(draft.production_request_preview_zh).toContain("产品类别：宣传印刷品");
  });

  it("create_supplychain_task generates die casting and enamel suggestions for badge", async () => {
    const store = createInMemoryStore();
    const result = await createSupplyChainTask(baseBadgeInput, store);

    expect(result.status).toBe("created");
    expect(result.recommended_execution_mode).toBe("human_operator_required");
    expect(result.initial_assessment.likely_processes).toContain("die casting");
    expect(result.initial_assessment.likely_processes).toContain("soft enamel");
    expect(result.initial_assessment.likely_processes).toContain("hard enamel");
  });

  it("generate_quote_request outputs Chinese quote request text", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    const result = await generateQuoteRequest({ task_id: task.task_id, language: "zh" }, store);

    expect(result.quote_request_text).toContain("你好");
    expect(result.quote_request_text).toContain("价格需要人工确认");
    expect(result.supplier_checklist).toContain("确认工艺可行性");
  });

  it("update_task_status updates status", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    const result = await updateTaskStatus(
      { task_id: task.task_id, status: "operator_reviewing", message: "Operator reviewing." },
      store,
    );

    expect(result.status).toBe("operator_reviewing");
    expect(result.updated_at).toEqual(expect.any(String));
  });

  it("get_task returns task details", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await generateQuoteRequest({ task_id: task.task_id, language: "en" }, store);
    const result = await getTask({ task_id: task.task_id }, store);

    expect(result.task_id).toBe(task.task_id);
    expect(result.title).toBe(baseBadgeInput.title);
    expect(result.category).toBe("badge");
    expect(result.quote_request).toMatchObject({ language: "en" });
    expect(result.history.length).toBeGreaterThanOrEqual(2);
  });

  it("upload_sample_result saves sample result", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    const upload = await uploadSampleResult(
      {
        task_id: task.task_id,
        sample_images: ["https://example.com/sample.jpg"],
        quoted_price: "Needs manual confirmation: RMB 8.50 per unit estimate from supplier chat",
        production_time: "7-10 days after sample approval",
        quality_notes: "Edges and plating should be checked before bulk production.",
        shipping_info: "Manual logistics quote required.",
      },
      store,
    );
    const loaded = await getTask({ task_id: task.task_id }, store);

    expect(upload.status).toBe("created");
    expect(upload.result_summary.quality_notes).toContain("plating");
    expect(loaded.sample_result).toMatchObject({
      quotedPrice: "Needs manual confirmation: RMB 8.50 per unit estimate from supplier chat",
    });
  });

  it("runs the user-confirmation, production-feedback, mock-payment, and fulfillment flow", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);

    const draft = await generateOrderDraft(
      {
        task_id: task.task_id,
        production_title_zh: "发布礼盒珐琅徽章",
        production_description_zh: "生产200枚锌合金硬珐琅徽章，金色电镀，独立袋装并配背卡。",
        production_spec_zh: {
          material: "锌合金",
          dimensions: "宽30毫米、厚2毫米",
          process: "硬珐琅、金色电镀",
          color_requirements: "在可行范围内匹配品牌潘通色",
          packaging_requirements: "独立OPP袋并配背卡",
          artwork_requirements: "需要可生产的矢量图稿",
          target_market: "美国",
          shipping_destination: "美国加利福尼亚州洛杉矶",
          requested_budget_range: "等待人工报价",
          notes: "测试任务",
        },
      },
      store,
    );
    expect(draft.user_language).toBe("en");
    expect(draft.user_confirmation_text).toContain("Please confirm this order draft");
    expect(draft.production_request_preview_zh).toContain("生产需求单");
    expect(draft.production_request_preview_zh).toContain("发布礼盒珐琅徽章");
    expect(draft.production_request_preview_zh).toContain("价格必须人工确认");
    expect(draft.order_draft).toMatchObject({
      product_name: "Launch box enamel badge",
      material: "zinc alloy",
      dimensions: "30mm width, 2mm thickness",
      process: "hard enamel with gold electroplating",
      confirmation_status: "draft",
      price: { status: "requires_human_confirmation" },
    });
    expect(draft.missing_requirements).toEqual([]);

    const confirmation = await confirmOrderDraft(
      { task_id: task.task_id, confirmed: true, message: "User approved the draft." },
      store,
    );
    expect(confirmation.status).toBe("user_confirmed");
    expect(confirmation.production_request?.status).toBe("pending_operator_review");
    expect(confirmation.production_request?.production_request_text_zh).toContain(
      "人工 Reality Operator",
    );
    expect(confirmation.production_request?.production_request_text_zh).toContain(
      "生产200枚锌合金硬珐琅徽章",
    );

    const feedback = await submitProductionFeedback(
      {
        task_id: task.task_id,
        feasible: true,
        confirmed_process: "hard enamel with gold electroplating",
        quote: "Manual confirmation required: RMB 9.80/unit at 200 pcs",
        total_amount: "1960.00",
        currency: "CNY",
        sample_cost: "Manual confirmation required: RMB 300",
        estimated_production_time: "12-15 days after sample approval",
        estimated_shipping_time: "5-8 days by air freight",
        risks: ["Pantone matching requires physical sample approval"],
        operator_notes: "Supplier can proceed after final vector artwork confirmation.",
      },
      store,
    );
    expect(feedback.status).toBe("production_feedback_received");
    expect(feedback.production_feedback.quote).toContain("Manual confirmation required");

    await expect(
      createPaymentLink(
        {
          task_id: task.task_id,
          accepted_quote_id: feedback.production_feedback.quote_id,
        },
        store,
      ),
    ).rejects.toThrow("Human gate");

    const feedbackConfirmation = await confirmProductionFeedback(
      {
        task_id: task.task_id,
        accepted: true,
        accepted_quote_id: feedback.production_feedback.quote_id,
        accepted_risks: true,
        message: "User approved the exact quote and risk list.",
      },
      store,
    );
    expect(feedbackConfirmation.status).toBe("production_feedback_received");

    const payment = await createPaymentLink(
      {
        task_id: task.task_id,
        accepted_quote_id: feedback.production_feedback.quote_id,
        description: "Mock payment link for confirmed production feedback.",
      },
      store,
    );
    expect(payment.status).toBe("payment_link_created");
    expect(payment.payment_intent.provider).toBe("mock");
    expect(payment.payment_intent.amount).toBe("1960.00");
    expect(payment.payment_intent.currency).toBe("CNY");
    expect(payment.payment_intent.payment_url).toContain(payment.payment_intent.payment_id);

    const paymentConfirmation = await confirmMockPayment(
      {
        task_id: task.task_id,
        payment_id: payment.payment_intent.payment_id,
        confirmed: true,
        message: "Mock payment manually confirmed.",
      },
      store,
    );
    expect(paymentConfirmation.status).toBe("payment_confirmed");

    const production = await updateProductionStatus(
      {
        task_id: task.task_id,
        stage: "production_in_progress",
        message: "Production has started after mock payment confirmation.",
        production_photos: ["https://example.com/production.jpg"],
      },
      store,
    );
    expect(production.status).toBe("production_in_progress");
    expect(production.fulfillment.production_updates).toHaveLength(1);
    const quality = await updateProductionStatus(
      {
        task_id: task.task_id,
        stage: "quality_check",
        message: "Quality check passed before shipment.",
        production_photos: ["https://example.com/quality-check.jpg"],
      },
      store,
    );
    expect(quality.status).toBe("quality_check");

    const shipment = await submitShipmentInfo(
      {
        task_id: task.task_id,
        carrier: "Mock Air",
        tracking_number: "TRACK123",
        tracking_url: "https://example.com/track/TRACK123",
        estimated_delivery: "5-8 days",
      },
      store,
    );
    expect(shipment.status).toBe("shipped");
    expect(shipment.shipment.tracking_number).toBe("TRACK123");

    const completion = await completeTask(
      {
        task_id: task.task_id,
        completion_notes: "Mock delivery completed.",
        proof_urls: ["https://example.com/delivery-proof.jpg"],
      },
      store,
    );
    expect(completion.status).toBe("completed");

    const loaded = await getTask({ task_id: task.task_id }, store);
    expect(loaded.status).toBe("completed");
    expect(loaded.order_draft).toMatchObject({ confirmation_status: "user_confirmed" });
    expect(loaded.production_feedback).toMatchObject({
      feasible: true,
      estimated_production_time: "12-15 days after sample approval",
    });
    expect(loaded.payment_intent).toMatchObject({
      provider: "mock",
      status: "confirmed",
    });
    expect(loaded.fulfillment).toMatchObject({
      shipment: { tracking_number: "TRACK123" },
      completion: { completion_notes: "Mock delivery completed." },
    });
  });

  it("rejects an invalid status jump", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);

    await expect(
      updateTaskStatus({ task_id: task.task_id, status: "completed" }, store),
    ).rejects.toThrow("Invalid task status transition");
  });

  it("reuses the payment link for the same accepted quote", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await generateOrderDraft({ task_id: task.task_id }, store);
    await confirmOrderDraft({ task_id: task.task_id, confirmed: true }, store);
    const feedback = await submitProductionFeedback(
      {
        task_id: task.task_id,
        feasible: true,
        quote: "Human-confirmed quote",
        total_amount: "1960.00",
        currency: "CNY",
        risks: [],
      },
      store,
    );
    await confirmProductionFeedback(
      {
        task_id: task.task_id,
        accepted: true,
        accepted_quote_id: feedback.production_feedback.quote_id,
        accepted_risks: true,
      },
      store,
    );
    const firstPayment = await createPaymentLink(
      {
        task_id: task.task_id,
        accepted_quote_id: feedback.production_feedback.quote_id,
      },
      store,
    );

    const repeatedPayment = await createPaymentLink(
      {
        task_id: task.task_id,
        accepted_quote_id: feedback.production_feedback.quote_id,
      },
      store,
    );

    expect(repeatedPayment.reused_existing_link).toBe(true);
    expect(repeatedPayment.payment_intent.payment_id).toBe(firstPayment.payment_intent.payment_id);

    await updateTaskStatus(
      { task_id: task.task_id, status: "cancelled", message: "User cancelled." },
      store,
    );
    await expect(
      createPaymentLink(
        {
          task_id: task.task_id,
          accepted_quote_id: feedback.production_feedback.quote_id,
        },
        store,
      ),
    ).rejects.toThrow("Terminal states are final");
  });

  it("refuses user acceptance when production is not feasible", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await generateOrderDraft({ task_id: task.task_id }, store);
    await confirmOrderDraft({ task_id: task.task_id, confirmed: true }, store);
    const feedback = await submitProductionFeedback(
      {
        task_id: task.task_id,
        feasible: false,
        quote: "Operator marked this request as not feasible.",
        total_amount: "100.00",
        currency: "CNY",
      },
      store,
    );

    await expect(
      confirmProductionFeedback(
        {
          task_id: task.task_id,
          accepted: true,
          accepted_quote_id: feedback.production_feedback.quote_id,
          accepted_risks: true,
        },
        store,
      ),
    ).rejects.toThrow("infeasible");
  });

  it("requires production evidence before shipment and shipment before completion", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await generateOrderDraft({ task_id: task.task_id }, store);
    await confirmOrderDraft({ task_id: task.task_id, confirmed: true }, store);
    const feedback = await submitProductionFeedback(
      {
        task_id: task.task_id,
        feasible: true,
        quote: "Human-confirmed quote",
        total_amount: "1960.00",
        currency: "CNY",
      },
      store,
    );
    await confirmProductionFeedback(
      {
        task_id: task.task_id,
        accepted: true,
        accepted_quote_id: feedback.production_feedback.quote_id,
        accepted_risks: true,
      },
      store,
    );
    const payment = await createPaymentLink(
      {
        task_id: task.task_id,
        accepted_quote_id: feedback.production_feedback.quote_id,
      },
      store,
    );
    await confirmMockPayment(
      {
        task_id: task.task_id,
        payment_id: payment.payment_intent.payment_id,
        confirmed: true,
      },
      store,
    );

    await expect(
      submitShipmentInfo({ task_id: task.task_id, tracking_number: "TRACK-1" }, store),
    ).rejects.toThrow("submit_shipment_info is not valid");

    await updateProductionStatus({ task_id: task.task_id, stage: "production_in_progress" }, store);
    await expect(
      submitShipmentInfo({ task_id: task.task_id, tracking_number: "TRACK-1" }, store),
    ).rejects.toThrow("submit_shipment_info is not valid");
    await updateProductionStatus({ task_id: task.task_id, stage: "quality_check" }, store);

    await expect(completeTask({ task_id: task.task_id }, store)).rejects.toThrow(
      "complete_task is not valid",
    );
  });

  it("replaces a payment link when the user accepts a newer quote", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await generateOrderDraft({ task_id: task.task_id }, store);
    await confirmOrderDraft({ task_id: task.task_id, confirmed: true }, store);

    const quoteA = await submitProductionFeedback(
      {
        task_id: task.task_id,
        feasible: true,
        quote: "First operator quote",
        total_amount: "1000.00",
        currency: "CNY",
      },
      store,
    );
    await confirmProductionFeedback(
      {
        task_id: task.task_id,
        accepted: true,
        accepted_quote_id: quoteA.production_feedback.quote_id,
        accepted_risks: true,
      },
      store,
    );
    const paymentA = await createPaymentLink(
      {
        task_id: task.task_id,
        accepted_quote_id: quoteA.production_feedback.quote_id,
      },
      store,
    );

    const quoteB = await submitProductionFeedback(
      {
        task_id: task.task_id,
        feasible: true,
        quote: "Revised operator quote",
        total_amount: "1200.00",
        currency: "CNY",
      },
      store,
    );
    await confirmProductionFeedback(
      {
        task_id: task.task_id,
        accepted: true,
        accepted_quote_id: quoteB.production_feedback.quote_id,
        accepted_risks: true,
      },
      store,
    );
    const paymentB = await createPaymentLink(
      {
        task_id: task.task_id,
        accepted_quote_id: quoteB.production_feedback.quote_id,
      },
      store,
    );

    expect(paymentB.reused_existing_link).toBe(false);
    expect(paymentB.payment_intent.amount).toBe("1200.00");
    expect(paymentB.payment_intent.payment_id).not.toBe(paymentA.payment_intent.payment_id);
    expect(paymentB.payment_intent.source_quote_id).toBe(quoteB.production_feedback.quote_id);
  });

  it("rejects malformed amounts and currency codes", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await generateOrderDraft({ task_id: task.task_id }, store);
    await confirmOrderDraft({ task_id: task.task_id, confirmed: true }, store);

    await expect(
      submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          total_amount: "-100.00",
          currency: "CNY",
        },
        store,
      ),
    ).rejects.toThrow();
    await expect(
      submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          total_amount: "100.00",
          currency: "cny",
        },
        store,
      ),
    ).rejects.toThrow();
    await expect(
      submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          total_amount: "100.00",
        },
        store,
      ),
    ).rejects.toThrow("currency is required");
    await expect(
      submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          currency: "CNY",
        },
        store,
      ),
    ).rejects.toThrow("total_amount is required");
  });

  it("blocks evidence-bearing stages in the generic status tool", async () => {
    const store = createInMemoryStore();
    const task = await createSupplyChainTask(baseBadgeInput, store);
    await updateTaskStatus({ task_id: task.task_id, status: "operator_reviewing" }, store);

    await expect(
      updateTaskStatus({ task_id: task.task_id, status: "quote_received" }, store),
    ).rejects.toThrow("Use the dedicated business tool");
  });
});
