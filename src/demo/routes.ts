import type { Express, Request, Response } from "express";
import {
  completeTask,
  confirmMockPayment,
  confirmOrderDraft,
  confirmProductionFeedback,
  createPaymentLink,
  createSupplyChainTask,
  generateArtworkBrief,
  generateOrderDraft,
  generateQuoteRequest,
  getTask,
  submitProductionFeedback,
  submitShipmentInfo,
  updateProductionStatus,
  type SupplyChainStore,
} from "../tools/index.js";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response) => void {
  return (req, res) => {
    handler(req, res).catch((error) => {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown demo error",
      });
    });
  };
}

function demoHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI 交互演示</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --panel: #ffffff;
        --ink: #17202a;
        --muted: #5f6f86;
        --line: #d7dee9;
        --ai: #0b63ce;
        --operator: #0f766e;
        --warn: #b45309;
        --ok: #067647;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      header {
        background: #111827;
        color: #fff;
        padding: 24px clamp(18px, 4vw, 48px);
      }
      h1 {
        margin: 0;
        font-size: clamp(24px, 4vw, 38px);
        line-height: 1.15;
      }
      header p {
        max-width: 920px;
        margin: 10px 0 0;
        color: #cbd5e1;
        line-height: 1.6;
      }
      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      a, button {
        border-radius: 6px;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--ink);
        min-height: 38px;
        padding: 9px 13px;
        font: inherit;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
      }
      button.primary, a.primary {
        background: var(--ai);
        color: #fff;
        border-color: var(--ai);
      }
      main {
        padding: 22px clamp(18px, 4vw, 48px) 44px;
      }
      .notice {
        border-left: 4px solid var(--warn);
        background: #fff7ed;
        padding: 12px 14px;
        margin-bottom: 20px;
        color: #7c2d12;
        line-height: 1.55;
      }
      .flow {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
        margin: 18px 0 26px;
      }
      .step {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 12px;
        min-height: 108px;
      }
      .step strong {
        display: block;
        font-size: 14px;
        margin-bottom: 6px;
      }
      .step span {
        display: block;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .columns {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 18px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
      }
      .panel header {
        padding: 14px 16px;
        background: #fff;
        color: var(--ink);
        border-bottom: 1px solid var(--line);
      }
      .panel.ai header { border-top: 5px solid var(--ai); }
      .panel.operator header { border-top: 5px solid var(--operator); }
      .panel h2 {
        margin: 0;
        font-size: 18px;
      }
      .panel p {
        margin: 6px 0 0;
        color: var(--muted);
        line-height: 1.5;
      }
      .body {
        padding: 16px;
        display: grid;
        gap: 14px;
      }
      .message {
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 12px;
        background: #fbfdff;
      }
      .message h3 {
        margin: 0 0 8px;
        font-size: 15px;
      }
      .message pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.55;
      }
      .tag {
        display: inline-flex;
        border-radius: 999px;
        padding: 3px 9px;
        background: #edf2f7;
        color: #334155;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .ok { color: var(--ok); }
      .muted { color: var(--muted); }
      .loading {
        display: none;
        color: var(--muted);
        font-weight: 700;
      }
      .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }
      @media (max-width: 980px) {
        .flow { grid-template-columns: 1fr; }
        .columns { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>MadeForAI 到底怎么用</h1>
      <p>这个页面把系统拆成两边：左边是全球用户在 Codex / Claude / Gemini 里看到的 AI 端交互，默认英文；右边是义乌/工厂/Reality Operator 看到的生产端交互，固定中文。</p>
      <nav>
        <a class="primary" href="/operator">打开生产端控制台</a>
        <a href="/health">健康检查</a>
      </nav>
    </header>

    <main>
      <div class="notice">
        重要边界：MadeForAI 当前不生成图片、不运行 LLM、不处理真实支付、不自动下单。它负责把 AI 的制造需求变成可人工执行的供应链任务，并让生产端回传报价、交期、样品、物流和交付结果。
      </div>

      <section class="flow">
        <div class="step"><strong>1. AI 引导用户准备素材</strong><span>用户用自己的 AI 或设计师准备生产图稿，MadeForAI 只给规范。</span></div>
        <div class="step"><strong>2. AI 提交任务</strong><span>产品名称、数量、材质、尺寸、素材链接进入 Skill。</span></div>
        <div class="step"><strong>3. 用户确认订单草稿</strong><span>用户侧默认英文，确认后才进入生产端。</span></div>
        <div class="step"><strong>4. 生产端中文处理</strong><span>Reality Operator 用中文任务单确认工艺、价格、交期。</span></div>
        <div class="step"><strong>5. 付款后生产交付</strong><span>当前是 mock 支付；确认后记录生产、物流、完成。</span></div>
      </section>

      <div class="actions">
        <button id="runDemo" class="primary" type="button">生成一条完整演示任务</button>
        <span id="loading" class="loading">正在生成演示任务...</span>
        <span id="summary" class="muted"></span>
      </div>

      <section class="columns">
        <article class="panel ai">
          <header>
            <h2>AI 应用端，给全球用户看</h2>
            <p>这里模拟 Codex / Claude / Gemini 调用 MadeForAI 后，应该对用户说什么。</p>
          </header>
          <div id="aiSide" class="body">
            <div class="message"><span class="tag">等待演示</span><pre>点击“生成一条完整演示任务”，这里会出现英文用户侧交互。</pre></div>
          </div>
        </article>

        <article class="panel operator">
          <header>
            <h2>生产端，给 Reality Operator / 工厂看</h2>
            <p>这里模拟后台生产人员收到的中文任务单和需要填写的反馈。</p>
          </header>
          <div id="operatorSide" class="body">
            <div class="message"><span class="tag">等待演示</span><pre>点击“生成一条完整演示任务”，这里会出现中文生产端内容。</pre></div>
          </div>
        </article>
      </section>
    </main>

    <script>
      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }

      function block(title, tag, text) {
        return '<div class="message"><span class="tag">' + escapeHtml(tag) + '</span><h3>' + escapeHtml(title) + '</h3><pre>' + escapeHtml(text || "-") + '</pre></div>';
      }

      function list(items) {
        return (items || []).map((item) => "- " + item).join("\\n");
      }

      async function runDemo() {
        const loading = document.getElementById("loading");
        const summary = document.getElementById("summary");
        const button = document.getElementById("runDemo");
        loading.style.display = "inline";
        summary.textContent = "";
        button.disabled = true;
        try {
          const response = await fetch("/demo/api/run", { method: "POST" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "演示生成失败");

          document.getElementById("aiSide").innerHTML = [
            block("Step 1: AI asks the user to prepare production artwork", "English user side", data.artwork_brief.brief_text + "\\n\\nChecklist:\\n" + list(data.artwork_brief.production_artwork_checklist)),
            block("Step 2: AI creates a supply chain task", "MCP tool result", "Task ID: " + data.task.task_id + "\\nStatus: " + data.task.status + "\\nRecommended mode: " + data.task.recommended_execution_mode),
            block("Step 3: AI shows an order draft for user confirmation", "English user side", data.order_draft.user_confirmation_text),
            block("Step 4: AI receives production feedback and asks whether to proceed", "English user side", "Feasible: " + data.production_feedback.production_feedback.feasible + "\\nQuote: " + (data.production_feedback.production_feedback.quote || "-") + "\\nProduction time: " + (data.production_feedback.production_feedback.estimated_production_time || "-") + "\\nShipping time: " + (data.production_feedback.production_feedback.estimated_shipping_time || "-") + "\\nRisks:\\n" + list(data.production_feedback.production_feedback.risks)),
            block("Step 5: AI shows mock payment and final delivery status", "English user side", "Mock payment URL: " + data.payment.payment_intent.payment_url + "\\nPayment status: " + data.payment_confirmation.status + "\\nFinal task status: " + data.final_task.status)
          ].join("");

          document.getElementById("operatorSide").innerHTML = [
            block("生产需求单", "中文生产端", data.order_draft.production_request_preview_zh),
            block("给供应商/市场人员的中文询价文本", "中文生产端", data.quote_request.quote_request_text),
            block("生产端已填写的反馈", "中文生产端", "是否可做：是\\n确认工艺：" + data.production_feedback.production_feedback.confirmed_process + "\\n报价：" + data.production_feedback.production_feedback.quote + "\\n打样费：" + data.production_feedback.production_feedback.sample_cost + "\\n生产周期：" + data.production_feedback.production_feedback.estimated_production_time + "\\n物流周期：" + data.production_feedback.production_feedback.estimated_shipping_time),
            block("生产/物流/交付记录", "中文生产端", "生产状态：" + data.production.status + "\\n物流单号：" + data.shipment.shipment.tracking_number + "\\n完成状态：" + data.completion.status)
          ].join("");

          summary.innerHTML = '<span class="ok">已生成演示任务：</span>' + escapeHtml(data.task.task_id) + '。可到生产端控制台查看。';
        } catch (error) {
          summary.textContent = error.message;
        } finally {
          loading.style.display = "none";
          button.disabled = false;
        }
      }

      document.getElementById("runDemo").addEventListener("click", runDemo);
    </script>
  </body>
</html>`;
}

export function registerDemoRoutes(app: Express, store: SupplyChainStore): void {
  app.get("/", (_req, res) => {
    res.redirect("/acceptance");
  });

  app.get("/demo", (_req, res) => {
    res.type("html").send(demoHtml());
  });

  app.post(
    "/demo/api/run",
    asyncHandler(async (_req, res) => {
      const artworkBrief = await generateArtworkBrief({
        product_category: "acrylic",
        product_name: "Acrylic character standee",
        manufacturing_goal: "Prepare a small-batch acrylic standee sample for a global fan merch drop.",
        quantity: 100,
        target_market: "US and EU",
        language: "en",
      });

      const task = await createSupplyChainTask(
        {
          title: "Acrylic character standee sample",
          description:
            "Small-batch acrylic character standee with UV printing, clear acrylic body, individual packaging, and global shipping validation.",
          product_category: "acrylic",
          product_name: "Acrylic character standee",
          quantity: 100,
          material: "3mm clear acrylic",
          dimensions: "120mm height, custom die-cut shape",
          process: "laser cutting, UV printing, protective film",
          color_requirements: "Match submitted artwork as closely as possible; confirm white ink layer.",
          packaging_requirements: "Individual opp bag with protective film; carton packing for export.",
          artwork_requirements:
            "Production-ready transparent PNG or vector file, separate cut line, front print layer, white ink layer.",
          budget_range: "Manual quote required",
          target_market: "US and EU",
          asset_urls: ["https://example.com/demo-acrylic-standee-artwork.png"],
          shipping_destination: "Los Angeles, CA, USA",
          notes: "This is a local demo task. Do not place a real order.",
        },
        store,
      );

      const quoteRequest = await generateQuoteRequest({
        task_id: task.task_id,
        language: "zh",
      }, store);

      const orderDraft = await generateOrderDraft({
        task_id: task.task_id,
        user_language: "en",
        production_title_zh: "透明亚克力角色立牌",
        production_description_zh:
          "生产100个3毫米透明亚克力角色立牌，采用激光切割、UV彩印和白墨打底，完成打样确认后再量产。",
        production_spec_zh: {
          material: "3毫米透明亚克力板",
          dimensions: "按角色外轮廓和确认底座尺寸",
          process: "激光切割、UV彩印、白墨打底",
          color_requirements: "按确认样匹配角色图稿颜色",
          packaging_requirements: "单个保护袋包装，外箱防刮防压",
          artwork_requirements: "高清图稿、独立切割线和白墨图层",
          target_market: "海外周边市场",
          shipping_destination: "美国加利福尼亚州洛杉矶",
          requested_budget_range: "等待人工报价",
          notes: "演示任务，不得自动向供应商下单。",
        },
      }, store);

      const confirmation = await confirmOrderDraft(
        {
          task_id: task.task_id,
          confirmed: true,
          message: "Demo user approved the English order draft.",
        },
        store,
      );

      const productionFeedback = await submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          confirmed_process: "3mm clear acrylic, laser cutting, UV printing, white ink backing",
          quote: "Manual confirmation required: RMB 12.80/unit at 100 pcs",
          total_amount: "1280.00",
          currency: "CNY",
          sample_cost: "Manual confirmation required: RMB 180 sample fee",
          estimated_production_time: "7-10 days after sample approval",
          estimated_shipping_time: "5-8 days by air freight after production",
          risks: [
            "White ink layer must be checked before bulk production",
            "Edge polishing quality depends on acrylic supplier and cutting settings",
          ],
          operator_notes: "Demo feedback from production side. No real supplier order was placed.",
        },
        store,
      );

      await confirmProductionFeedback(
        {
          task_id: task.task_id,
          accepted: true,
          accepted_quote_id: productionFeedback.production_feedback.quote_id,
          accepted_risks: true,
          message: "Demo user accepted the operator quote and risks.",
        },
        store,
      );

      const payment = await createPaymentLink(
        {
          task_id: task.task_id,
          accepted_quote_id: productionFeedback.production_feedback.quote_id,
          description: "Demo mock payment for acrylic standee sample workflow",
        },
        store,
      );

      const paymentConfirmation = await confirmMockPayment(
        {
          task_id: task.task_id,
          payment_id: payment.payment_intent.payment_id,
          confirmed: true,
          message: "Demo mock payment confirmed. No real money was processed.",
        },
        store,
      );

      const production = await updateProductionStatus(
        {
          task_id: task.task_id,
          stage: "production_in_progress",
          message: "Demo production has started after mock payment confirmation.",
          production_photos: ["https://example.com/demo-production-photo.jpg"],
        },
        store,
      );
      await updateProductionStatus(
        {
          task_id: task.task_id,
          stage: "quality_check",
          message: "Demo quality check passed before shipment.",
          production_photos: ["https://example.com/demo-quality-check-photo.jpg"],
        },
        store,
      );

      const shipment = await submitShipmentInfo(
        {
          task_id: task.task_id,
          carrier: "Demo Air",
          tracking_number: "DEMO123456",
          tracking_url: "https://example.com/track/DEMO123456",
          estimated_delivery: "5-8 days",
          shipping_notes: "Demo shipment record. No real package was shipped.",
        },
        store,
      );

      const completion = await completeTask(
        {
          task_id: task.task_id,
          completion_notes: "Demo task completed for local product validation.",
          proof_urls: ["https://example.com/demo-delivery-proof.jpg"],
        },
        store,
      );

      const finalTask = await getTask({ task_id: task.task_id }, store);

      res.json({
        artwork_brief: artworkBrief,
        task,
        quote_request: quoteRequest,
        order_draft: orderDraft,
        confirmation,
        production_feedback: productionFeedback,
        payment,
        payment_confirmation: paymentConfirmation,
        production,
        shipment,
        completion,
        final_task: finalTask,
      });
    }),
  );
}
