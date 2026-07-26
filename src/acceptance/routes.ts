import type { Express, Request, Response } from "express";
import { z } from "zod";
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
import { userWorkspaceHtml } from "../ui/userWorkspace.js";

type Check = {
  title: string;
  explain: string;
  pass: boolean;
  proof: string;
};

const UserDemoStartSchema = z.object({
  request: z.string().trim().min(20).max(2_000),
});

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response) => void {
  return (req, res) => {
    handler(req, res).catch((error) => {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unknown acceptance error",
      });
    });
  };
}

function check(title: string, explain: string, pass: boolean, proof: string): Check {
  return { title, explain, pass, proof };
}

function html(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI 中文验收助手</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --panel: #ffffff;
        --ink: #17202a;
        --muted: #64748b;
        --line: #d7dee9;
        --blue: #0b63ce;
        --green: #067647;
        --red: #b42318;
        --amber: #b45309;
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
        padding: 28px clamp(18px, 4vw, 52px);
      }
      h1 { margin: 0; font-size: clamp(26px, 4vw, 42px); }
      header p {
        max-width: 980px;
        margin: 12px 0 0;
        color: #cbd5e1;
        line-height: 1.7;
        font-size: 16px;
      }
      main { padding: 24px clamp(18px, 4vw, 52px) 48px; }
      .intro, .guide {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 18px;
        margin-bottom: 16px;
        line-height: 1.75;
      }
      .guide {
        background: #fff7ed;
        border-left: 5px solid var(--amber);
      }
      .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin: 18px 0;
      }
      button, a {
        border: 1px solid var(--line);
        border-radius: 7px;
        min-height: 42px;
        padding: 10px 14px;
        background: #fff;
        color: var(--ink);
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
      }
      button.primary {
        background: var(--blue);
        border-color: var(--blue);
        color: #fff;
      }
      button:disabled { opacity: 0.58; cursor: not-allowed; }
      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .metric {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 16px;
      }
      .metric strong {
        display: block;
        font-size: 28px;
        margin-bottom: 4px;
      }
      .metric span { color: var(--muted); }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 10px;
        overflow: hidden;
      }
      .panel h2 {
        margin: 0;
        padding: 16px;
        font-size: 20px;
        border-bottom: 1px solid var(--line);
      }
      .body { padding: 16px; display: grid; gap: 12px; }
      .check {
        border: 1px solid var(--line);
        border-radius: 9px;
        padding: 14px;
        background: #fbfdff;
      }
      .check.pass { border-left: 5px solid var(--green); }
      .check.fail { border-left: 5px solid var(--red); }
      .check.wait { border-left: 5px solid var(--amber); }
      .check h3 { margin: 0 0 7px; font-size: 16px; }
      .check p { margin: 0 0 8px; color: var(--muted); line-height: 1.6; }
      .proof {
        white-space: pre-wrap;
        word-break: break-word;
        background: #f8fafc;
        border-radius: 7px;
        padding: 10px;
        line-height: 1.55;
      }
      .passText { color: var(--green); font-weight: 900; }
      .failText { color: var(--red); font-weight: 900; }
      @media (max-width: 980px) {
        .grid, .summary { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>MadeForAI 中文验收助手</h1>
      <p>你不需要看代码，也不需要懂 MCP。点击一次按钮，系统会自动模拟完整业务链路，并用中文告诉你每一步是否通过。</p>
    </header>
    <main>
      <section class="intro">
        <strong>你要验收的结果：</strong>
        全球用户在 AI 应用里用英文完成需求提交；生产端收到中文任务单；人工 Reality Operator 回传报价、交期、风险；用户确认后进入 mock 支付；支付确认后记录生产、物流和完成。
      </section>
      <div class="actions">
        <button id="runAcceptance" class="primary" type="button">一键自动验收</button>
        <a href="/operator">打开生产端后台</a>
        <a href="/demo">查看左右两端演示</a>
        <span id="state">尚未开始</span>
      </div>
      <section class="summary">
        <div class="metric"><strong id="passed">0</strong><span>通过项目</span></div>
        <div class="metric"><strong id="failed">0</strong><span>失败项目</span></div>
        <div class="metric"><strong id="verdict">未验收</strong><span>最终结论</span></div>
      </section>
      <section class="grid">
        <article class="panel">
          <h2>AI 用户端验收</h2>
          <div id="aiChecks" class="body">
            <div class="check wait"><h3>等待运行</h3><p>这里会显示全球用户在 AI 端的链路是否跑通。</p></div>
          </div>
        </article>
        <article class="panel">
          <h2>中文生产端验收</h2>
          <div id="operatorChecks" class="body">
            <div class="check wait"><h3>等待运行</h3><p>这里会显示 Reality Operator / 工厂端的链路是否跑通。</p></div>
          </div>
        </article>
      </section>
      <section class="guide">
        <strong>怎么判断：</strong>
        如果最终结论是“通过”，说明这个项目已经具备最小可验证闭环。它还不是完整商业平台，但已经可以作为 AI Skill 骨架继续往真实业务推进。
      </section>
    </main>
    <script>
      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }
      function renderCheck(item) {
        const cls = item.pass ? "pass" : "fail";
        const text = item.pass ? "通过" : "失败";
        const textCls = item.pass ? "passText" : "failText";
        return '<div class="check ' + cls + '">' +
          '<h3><span class="' + textCls + '">' + text + '</span>｜' + escapeHtml(item.title) + '</h3>' +
          '<p>' + escapeHtml(item.explain) + '</p>' +
          '<div class="proof">' + escapeHtml(item.proof) + '</div>' +
          '</div>';
      }
      async function runAcceptance() {
        const button = document.getElementById("runAcceptance");
        const state = document.getElementById("state");
        button.disabled = true;
        state.textContent = "正在自动跑完整业务链路...";
        document.getElementById("aiChecks").innerHTML = '<div class="check wait"><h3>运行中</h3><p>正在模拟 AI 用户端。</p></div>';
        document.getElementById("operatorChecks").innerHTML = '<div class="check wait"><h3>运行中</h3><p>正在模拟中文生产端。</p></div>';
        try {
          const response = await fetch("/acceptance/api/run", { method: "POST" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "验收失败");
          document.getElementById("aiChecks").innerHTML = data.ai_checks.map(renderCheck).join("");
          document.getElementById("operatorChecks").innerHTML = data.operator_checks.map(renderCheck).join("");
          document.getElementById("passed").textContent = data.passed;
          document.getElementById("failed").textContent = data.failed;
          document.getElementById("verdict").textContent = data.failed === 0 ? "通过" : "不通过";
          document.getElementById("verdict").style.color = data.failed === 0 ? "var(--green)" : "var(--red)";
          state.textContent = "验收任务 ID：" + data.task_id;
        } catch (error) {
          document.getElementById("failed").textContent = "1";
          document.getElementById("verdict").textContent = "不通过";
          document.getElementById("verdict").style.color = "var(--red)";
          state.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      }
      document.getElementById("runAcceptance").addEventListener("click", runAcceptance);
    </script>
  </body>
</html>`;
}

function userDemoHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI 用户端样貌</title>
    <style>
      :root {
        --bg: #f4f6fb;
        --panel: #ffffff;
        --ink: #17202a;
        --muted: #667085;
        --line: #d7dee9;
        --blue: #0b63ce;
        --green: #067647;
        --amber: #b45309;
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
        padding: 24px clamp(18px, 4vw, 50px);
      }
      h1 { margin: 0; font-size: clamp(24px, 4vw, 38px); }
      header p {
        max-width: 980px;
        margin: 10px 0 0;
        color: #cbd5e1;
        line-height: 1.7;
      }
      main {
        display: grid;
        grid-template-columns: minmax(0, 760px) minmax(280px, 420px);
        gap: 18px;
        padding: 22px clamp(18px, 4vw, 50px) 44px;
        align-items: start;
      }
      .phone, .side {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        overflow: hidden;
      }
      .phoneHeader {
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }
      .phoneHeader strong { font-size: 16px; }
      .tag {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: #eef6ff;
        color: #0b4f9c;
        font-size: 12px;
        font-weight: 800;
        padding: 4px 9px;
      }
      .chat {
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .bubble {
        max-width: 86%;
        border-radius: 14px;
        padding: 12px 14px;
        line-height: 1.58;
        white-space: pre-wrap;
      }
      .bubble.user {
        justify-self: end;
        background: #0b63ce;
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .bubble.ai {
        justify-self: start;
        background: #f2f4f7;
        color: var(--ink);
        border-bottom-left-radius: 4px;
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        padding: 14px;
        display: grid;
        gap: 10px;
      }
      .card h2, .card h3 { margin: 0; font-size: 17px; }
      .rows {
        display: grid;
        grid-template-columns: 150px minmax(0, 1fr);
        gap: 8px 12px;
        font-size: 14px;
      }
      .label { color: var(--muted); }
      .value { overflow-wrap: anywhere; }
      .notice {
        border-left: 4px solid var(--amber);
        background: #fff7ed;
        padding: 10px 12px;
        color: #7c2d12;
        line-height: 1.55;
        border-radius: 8px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      button, a {
        border: 1px solid var(--line);
        border-radius: 7px;
        min-height: 40px;
        padding: 9px 13px;
        background: #fff;
        color: var(--ink);
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
      }
      button.primary {
        background: var(--blue);
        border-color: var(--blue);
        color: #fff;
      }
      button.pay {
        background: var(--green);
        border-color: var(--green);
        color: #fff;
      }
      button:disabled { opacity: 0.58; cursor: not-allowed; }
      .side { padding: 18px; display: grid; gap: 14px; }
      .side h2 { margin: 0; font-size: 20px; }
      .side p { margin: 0; color: var(--muted); line-height: 1.7; }
      .check {
        border: 1px solid var(--line);
        border-radius: 9px;
        padding: 12px;
        background: #fbfdff;
      }
      .check strong { display: block; margin-bottom: 5px; }
      .check span { color: var(--muted); line-height: 1.55; }
      .empty {
        color: var(--muted);
        padding: 22px;
        text-align: center;
      }
      @media (max-width: 1040px) {
        main { grid-template-columns: 1fr; }
        .bubble { max-width: 94%; }
      }
      @media (max-width: 620px) {
        .rows { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>用户端样貌验收</h1>
      <p>这里模拟全球用户在 Codex / Claude / Gemini 里调用 MadeForAI Skill 后看到的界面。用户侧默认英文，生产端中文内容不会直接压给用户。</p>
    </header>
    <main>
      <section class="phone">
        <div class="phoneHeader">
          <strong>AI App / MadeForAI Skill</strong>
          <span class="tag">User-facing: English</span>
        </div>
        <div class="chat" id="chat">
          <div class="empty">点击右侧“一键生成用户端样貌”，查看用户会看到什么。</div>
        </div>
      </section>
      <aside class="side">
        <h2>你要验证什么</h2>
        <p>用户端不是后台。它应该像 AI 对话和订单确认页：清楚告诉用户要准备什么、订单草稿是什么、生产端反馈了什么、付款前还需要确认什么。</p>
        <div class="actions">
          <button id="runUserDemo" class="primary" type="button">一键生成用户端样貌</button>
          <a href="/operator">去看中文生产端</a>
          <a href="/acceptance">去看自动验收</a>
        </div>
        <div class="check">
          <strong>验收标准 1</strong>
          <span>用户主界面必须是英文，适合全球用户。</span>
        </div>
        <div class="check">
          <strong>验收标准 2</strong>
          <span>用户能看到订单草稿和价格“人工确认”的边界。</span>
        </div>
        <div class="check">
          <strong>验收标准 3</strong>
          <span>用户能看到生产端反馈、mock 支付和最终状态，但不需要看中文生产后台。</span>
        </div>
      </aside>
    </main>
    <script>
      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }
      function bubble(kind, text) {
        return '<div class="bubble ' + kind + '">' + escapeHtml(text) + '</div>';
      }
      function row(label, value) {
        return '<div class="label">' + escapeHtml(label) + '</div><div class="value">' + escapeHtml(value ?? "-") + '</div>';
      }
      function orderCard(draft) {
        return '<div class="card"><h2>Order Draft</h2><div class="rows">' +
          row("Product", draft.product_name) +
          row("Category", draft.product_category) +
          row("Quantity", draft.quantity) +
          row("Material", draft.material) +
          row("Dimensions", draft.dimensions) +
          row("Process", draft.process) +
          row("Ship to", draft.shipping_destination) +
          row("Price", "Requires human confirmation") +
          '</div><div class="notice">No real-world order or payment will happen until the user confirms and the production side returns manual feedback.</div>' +
          '<div class="actions"><button class="primary" type="button">Confirm order draft</button><button type="button">Request changes</button></div></div>';
      }
      function feedbackCard(feedback) {
        return '<div class="card"><h2>Production Feedback</h2><div class="rows">' +
          row("Feasible", feedback.feasible ? "Yes" : "No") +
          row("Confirmed process", feedback.confirmed_process) +
          row("Quote ID", feedback.quote_id) +
          row("Quote", feedback.quote) +
          row("Order total", feedback.total_amount + " " + feedback.currency) +
          row("Sample cost", feedback.sample_cost) +
          row("Production time", feedback.estimated_production_time) +
          row("Shipping time", feedback.estimated_shipping_time) +
          row("Risks", (feedback.risks || []).join("; ")) +
          '</div><div class="actions"><button class="pay" type="button">Accept this quote and open mock payment</button><button type="button">Ask AI to explain risks</button></div></div>';
      }
      function statusCard(data) {
        return '<div class="card"><h2>Delivery Status</h2><div class="rows">' +
          row("Mock payment", data.payment_status) +
          row("Production", data.production_status) +
          row("Tracking", data.tracking_number) +
          row("Final status", data.final_status) +
          '</div></div>';
      }
      async function runUserDemo() {
        const button = document.getElementById("runUserDemo");
        const chat = document.getElementById("chat");
        button.disabled = true;
        chat.innerHTML = '<div class="empty">正在生成用户端样貌...</div>';
        try {
          const response = await fetch("/user/api/run", { method: "POST" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "生成失败");
          chat.innerHTML = [
            bubble("user", data.user_request),
            bubble("ai", data.artwork_message),
            bubble("ai", "I created a MadeForAI supply chain task. Task ID: " + data.task_id),
            orderCard(data.order_draft),
            bubble("ai", "The human production side has reviewed the request and returned manual feedback."),
            feedbackCard(data.production_feedback),
            bubble("ai", "This is a mock payment link for local workflow validation only. No real payment is processed."),
            statusCard(data.status)
          ].join("");
        } catch (error) {
          chat.innerHTML = '<div class="empty">' + escapeHtml(error.message) + '</div>';
        } finally {
          button.disabled = false;
        }
      }
      document.getElementById("runUserDemo").addEventListener("click", runUserDemo);
    </script>
  </body>
</html>`;
}

export function registerAcceptanceRoutes(app: Express, store: SupplyChainStore): void {
  app.get("/acceptance", (_req, res) => {
    res.type("html").send(html());
  });

  app.get("/user", (_req, res) => {
    res.type("html").send(userWorkspaceHtml());
  });

  app.get("/user/legacy", (_req, res) => {
    res.type("html").send(userDemoHtml());
  });

  app.post(
    "/user/api/start",
    asyncHandler(async (req, res) => {
      const input = UserDemoStartSchema.parse(req.body);
      const artworkBrief = await generateArtworkBrief({
        product_category: "sticker",
        product_name: "Waterproof vinyl sticker pack",
        manufacturing_goal: "Prepare production-ready artwork for a global merch drop.",
        quantity: 500,
        target_market: "US and EU",
        language: "en",
      });
      const task = await createSupplyChainTask(
        {
          title: "Waterproof vinyl sticker pack",
          description: input.request,
          product_category: "sticker",
          product_name: "Waterproof vinyl sticker pack",
          quantity: 500,
          material: "waterproof vinyl",
          dimensions: "80mm x 80mm average sticker size, kiss-cut sheet format",
          process: "vinyl printing, kiss cutting, matte lamination",
          color_requirements: "Match submitted artwork as closely as possible.",
          packaging_requirements: "10 stickers per pack, clear OPP bag, export carton.",
          artwork_requirements:
            "High-resolution PNG or vector artwork, kiss-cut outline, bleed, and safe area.",
          budget_range: "Manual quote required",
          target_market: "US and EU",
          asset_urls: ["https://example.com/user-demo-sticker-artwork.png"],
          shipping_destination: "Los Angeles, CA, USA",
          notes: "Competition walkthrough. Do not place a real order.",
        },
        store,
      );
      const orderDraft = await generateOrderDraft(
        {
          task_id: task.task_id,
          user_language: "en",
          production_title_zh: "防水乙烯基贴纸套装",
          production_description_zh:
            "生产500套全球周边发行用防水乙烯基贴纸，每套10枚吻切贴纸，表面覆哑膜，发往美国洛杉矶。",
          production_spec_zh: {
            material: "防水乙烯基材料",
            dimensions: "单枚平均80毫米×80毫米，吻切版式",
            process: "乙烯基彩印、吻切、表面覆哑膜",
            color_requirements: "尽量匹配用户提交图稿的颜色",
            packaging_requirements: "每套10枚，透明OPP袋包装，外箱适合出口运输",
            artwork_requirements: "高清PNG或矢量图稿，包含吻切线、出血位和安全区",
            target_market: "美国和欧盟",
            shipping_destination: "美国加利福尼亚州洛杉矶",
            requested_budget_range: "等待人工报价",
            notes: "比赛演示任务，不得自动下单。",
          },
        },
        store,
      );

      res.json({
        task_id: task.task_id,
        artwork_message: artworkBrief.brief_text,
        artwork_checklist: artworkBrief.production_artwork_checklist,
        order_draft: orderDraft.order_draft,
        status: "order_draft_created",
      });
    }),
  );

  app.post(
    "/user/api/tasks/:taskId/confirm",
    asyncHandler(async (req, res) => {
      const taskId = z.string().min(8).max(128).parse(req.params.taskId);
      await confirmOrderDraft(
        {
          task_id: taskId,
          confirmed: true,
          message: "User confirmed the competition walkthrough order draft.",
        },
        store,
      );
      const feedback = await submitProductionFeedback(
        {
          task_id: taskId,
          feasible: true,
          confirmed_process: "waterproof vinyl printing, kiss cutting, matte lamination",
          quote: "RMB 1.20 per sticker at 500 pcs · manually confirmed",
          total_amount: "600.00",
          currency: "CNY",
          sample_cost: "RMB 80 proof fee · manually confirmed",
          estimated_production_time: "5-7 days after proof approval",
          estimated_shipping_time: "5-8 days by air freight",
          risks: [
            "Fine cut lines need proof approval",
            "Waterproof vinyl stock must be verified before production",
          ],
          operator_notes:
            "Scripted Reality Operator response for the competition walkthrough only.",
        },
        store,
      );

      res.json({
        task_id: taskId,
        status: feedback.status,
        production_feedback: feedback.production_feedback,
      });
    }),
  );

  app.post(
    "/user/api/tasks/:taskId/pay",
    asyncHandler(async (req, res) => {
      const taskId = z.string().min(8).max(128).parse(req.params.taskId);
      const acceptedQuoteId = z.string().min(1).parse(req.body.accepted_quote_id);
      await confirmProductionFeedback(
        {
          task_id: taskId,
          accepted: true,
          accepted_quote_id: acceptedQuoteId,
          accepted_risks: true,
          message: "User accepted the operator quote and stated risks.",
        },
        store,
      );
      const payment = await createPaymentLink(
        {
          task_id: taskId,
          accepted_quote_id: acceptedQuoteId,
          description: "Competition walkthrough mock payment",
        },
        store,
      );
      const confirmation = await confirmMockPayment(
        {
          task_id: taskId,
          payment_id: payment.payment_intent.payment_id,
          confirmed: true,
          message: "Competition walkthrough mock payment confirmed.",
        },
        store,
      );
      const production = await updateProductionStatus(
        {
          task_id: taskId,
          stage: "production_in_progress",
          message: "Production intake confirmed after mock payment.",
        },
        store,
      );

      res.json({
        task_id: taskId,
        status: production.status,
        payment: confirmation.payment_intent,
        fulfillment: production.fulfillment,
      });
    }),
  );

  app.post(
    "/user/api/tasks/:taskId/fulfill",
    asyncHandler(async (req, res) => {
      const taskId = z.string().min(8).max(128).parse(req.params.taskId);
      await updateProductionStatus(
        {
          task_id: taskId,
          stage: "quality_check",
          message: "Visual inspection and count check passed.",
          production_photos: ["https://example.com/user-demo-quality-check.jpg"],
        },
        store,
      );
      const shipment = await submitShipmentInfo(
        {
          task_id: taskId,
          carrier: "Demo Air",
          tracking_number: "MFA-DEMO-2026",
          tracking_url: "https://example.com/track/MFA-DEMO-2026",
          estimated_delivery: "5-8 days",
        },
        store,
      );
      const completion = await completeTask(
        {
          task_id: taskId,
          completion_notes: "Competition walkthrough delivery confirmed.",
          proof_urls: ["https://example.com/user-demo-delivery-proof.jpg"],
        },
        store,
      );

      res.json({
        task_id: taskId,
        status: completion.status,
        shipment: shipment.shipment,
        completion: completion.completion,
      });
    }),
  );

  app.post(
    "/user/api/run",
    asyncHandler(async (_req, res) => {
      const artworkBrief = await generateArtworkBrief({
        product_category: "sticker",
        product_name: "Waterproof vinyl sticker pack",
        manufacturing_goal: "Prepare production-ready artwork for a global merch drop.",
        quantity: 500,
        target_market: "US and EU",
        language: "en",
      });

      const task = await createSupplyChainTask(
        {
          title: "Waterproof vinyl sticker pack",
          description:
            "A global customer wants a small-batch waterproof sticker pack with kiss-cut outlines, matte lamination, and export packaging.",
          product_category: "sticker",
          product_name: "Waterproof vinyl sticker pack",
          quantity: 500,
          material: "waterproof vinyl",
          dimensions: "80mm x 80mm average sticker size, kiss-cut sheet format",
          process: "vinyl printing, kiss cutting, matte lamination",
          color_requirements: "Match submitted artwork as closely as possible.",
          packaging_requirements: "10 stickers per pack, clear opp bag, export carton.",
          artwork_requirements:
            "High-resolution PNG or vector artwork, kiss-cut outline, bleed and safe area.",
          budget_range: "Manual quote required",
          target_market: "US and EU",
          asset_urls: ["https://example.com/user-demo-sticker-artwork.png"],
          shipping_destination: "Los Angeles, CA, USA",
          notes: "User-side visual demo. Do not place a real order.",
        },
        store,
      );

      const orderDraft = await generateOrderDraft(
        {
          task_id: task.task_id,
          user_language: "en",
          production_title_zh: "防水乙烯基贴纸套装",
          production_description_zh:
            "生产500套全球周边发行用防水乙烯基贴纸，每套10枚吻切贴纸，表面覆哑膜，发往美国洛杉矶。",
          production_spec_zh: {
            material: "防水乙烯基材料",
            dimensions: "单枚平均80毫米×80毫米，吻切版式",
            process: "乙烯基彩印、吻切、表面覆哑膜",
            color_requirements: "尽量匹配用户提交图稿的颜色",
            packaging_requirements: "每套10枚，透明OPP袋包装，外箱适合出口运输",
            artwork_requirements: "高清PNG或矢量图稿，包含吻切线、出血位和安全区",
            target_market: "美国和欧盟",
            shipping_destination: "美国加利福尼亚州洛杉矶",
            requested_budget_range: "等待人工报价",
            notes: "用户端演示任务，不得自动下单。",
          },
        },
        store,
      );
      await confirmOrderDraft(
        {
          task_id: task.task_id,
          confirmed: true,
          message: "User-side demo confirmed the order draft.",
        },
        store,
      );
      const productionFeedback = await submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          confirmed_process: "waterproof vinyl printing, kiss cutting, matte lamination",
          quote: "Manual confirmation required: RMB 1.20/sticker at 500 pcs",
          total_amount: "600.00",
          currency: "CNY",
          sample_cost: "Manual confirmation required: RMB 80 proof fee",
          estimated_production_time: "5-7 days after proof approval",
          estimated_shipping_time: "5-8 days by air freight",
          risks: [
            "Fine cut lines need proof approval",
            "Waterproof material must be confirmed before production",
          ],
          operator_notes: "User-side demo feedback only.",
        },
        store,
      );
      await confirmProductionFeedback(
        {
          task_id: task.task_id,
          accepted: true,
          accepted_quote_id: productionFeedback.production_feedback.quote_id,
          accepted_risks: true,
          message: "User-side demo accepted the operator quote and risks.",
        },
        store,
      );
      const payment = await createPaymentLink(
        {
          task_id: task.task_id,
          accepted_quote_id: productionFeedback.production_feedback.quote_id,
          description: "User-side demo mock payment",
        },
        store,
      );
      const paymentConfirmation = await confirmMockPayment(
        {
          task_id: task.task_id,
          payment_id: payment.payment_intent.payment_id,
          confirmed: true,
          message: "User-side demo mock payment confirmed.",
        },
        store,
      );
      const production = await updateProductionStatus(
        {
          task_id: task.task_id,
          stage: "production_in_progress",
          message: "User-side demo production in progress.",
        },
        store,
      );
      const qualityCheck = await updateProductionStatus(
        {
          task_id: task.task_id,
          stage: "quality_check",
          message: "User-side demo quality check passed before shipment.",
          production_photos: ["https://example.com/user-demo-quality-check.jpg"],
        },
        store,
      );
      const shipment = await submitShipmentInfo(
        {
          task_id: task.task_id,
          carrier: "Demo Air",
          tracking_number: "USERDEMO123",
          tracking_url: "https://example.com/track/USERDEMO123",
          estimated_delivery: "5-8 days",
        },
        store,
      );
      const completion = await completeTask(
        {
          task_id: task.task_id,
          completion_notes: "User-side demo completed.",
          proof_urls: ["https://example.com/user-demo-proof.jpg"],
        },
        store,
      );

      res.json({
        user_request:
          "I want to make 500 waterproof vinyl sticker packs for a global merch drop. I have artwork links and need a manual production quote.",
        artwork_message: artworkBrief.brief_text,
        task_id: task.task_id,
        order_draft: orderDraft.order_draft,
        production_feedback: productionFeedback.production_feedback,
        status: {
          payment_status: paymentConfirmation.status,
          production_status: production.status,
          quality_check_status: qualityCheck.status,
          tracking_number: shipment.shipment.tracking_number,
          final_status: completion.status,
        },
      });
    }),
  );

  app.post(
    "/acceptance/api/run",
    asyncHandler(async (_req, res) => {
      const artworkBrief = await generateArtworkBrief({
        product_category: "packaging_card",
        product_name: "Retail packaging backing card",
        manufacturing_goal: "Create a small-batch packaging card task through an AI client.",
        quantity: 300,
        target_market: "Global direct-to-consumer launch",
        language: "en",
      });

      const task = await createSupplyChainTask(
        {
          title: "Retail packaging backing card",
          description:
            "Small-batch printed backing card for collectible merchandise. Needs manual quote, sample confirmation, and shipping feedback.",
          product_category: "packaging_card",
          product_name: "Retail packaging backing card",
          quantity: 300,
          material: "350gsm coated paper",
          dimensions: "90mm x 140mm, rounded corners, hanging hole",
          process: "offset or digital printing, matte lamination, die cutting",
          color_requirements: "Match brand colors from submitted artwork as closely as possible.",
          packaging_requirements: "Bundle in packs of 50, export carton packing.",
          artwork_requirements:
            "Print-ready PDF with bleed, safe area, dieline, and hanging hole position.",
          budget_range: "Manual quote required",
          target_market: "US and EU",
          asset_urls: ["https://example.com/acceptance-packaging-card.pdf"],
          shipping_destination: "Los Angeles, CA, USA",
          notes: "Acceptance test task. Do not place a real order.",
        },
        store,
      );

      const quoteRequest = await generateQuoteRequest(
        { task_id: task.task_id, language: "zh" },
        store,
      );
      const orderDraft = await generateOrderDraft(
        {
          task_id: task.task_id,
          user_language: "en",
          production_title_zh: "零售包装背卡",
          production_description_zh:
            "生产300张350克铜版纸零售包装背卡，覆哑膜并模切，发往美国洛杉矶。",
          production_spec_zh: {
            material: "350克铜版纸",
            dimensions: "按确认后的包装刀模尺寸",
            process: "彩色印刷、覆哑膜、模切",
            color_requirements: "按确认样校准印刷颜色",
            packaging_requirements: "平整装箱，避免折角和表面刮花",
            artwork_requirements: "印刷PDF与独立刀模线文件",
            target_market: "美国",
            shipping_destination: "美国加利福尼亚州洛杉矶",
            requested_budget_range: "等待人工报价",
            notes: "自动验收任务，不得自动下单。",
          },
        },
        store,
      );
      const confirmation = await confirmOrderDraft(
        {
          task_id: task.task_id,
          confirmed: true,
          message: "Acceptance user confirmed the order draft.",
        },
        store,
      );
      const productionFeedback = await submitProductionFeedback(
        {
          task_id: task.task_id,
          feasible: true,
          confirmed_process: "350gsm coated paper, matte lamination, die cutting",
          quote: "Manual confirmation required: RMB 2.60/unit at 300 pcs",
          total_amount: "780.00",
          currency: "CNY",
          sample_cost: "Manual confirmation required: RMB 120 sample/proof fee",
          estimated_production_time: "5-7 days after proof approval",
          estimated_shipping_time: "5-8 days by air freight",
          risks: [
            "Color consistency requires printed proof confirmation",
            "Hanging hole and rounded corner dieline must be checked before bulk production",
          ],
          operator_notes: "Acceptance feedback only. No real supplier order was placed.",
        },
        store,
      );
      await confirmProductionFeedback(
        {
          task_id: task.task_id,
          accepted: true,
          accepted_quote_id: productionFeedback.production_feedback.quote_id,
          accepted_risks: true,
          message: "Acceptance user accepted the operator quote and risks.",
        },
        store,
      );
      const payment = await createPaymentLink(
        {
          task_id: task.task_id,
          accepted_quote_id: productionFeedback.production_feedback.quote_id,
          description: "Acceptance mock payment. No real money is processed.",
        },
        store,
      );
      const paymentConfirmation = await confirmMockPayment(
        {
          task_id: task.task_id,
          payment_id: payment.payment_intent.payment_id,
          confirmed: true,
          message: "Acceptance mock payment confirmed.",
        },
        store,
      );
      const production = await updateProductionStatus(
        {
          task_id: task.task_id,
          stage: "quality_check",
          message: "Acceptance task reached quality check after mock payment.",
          production_photos: ["https://example.com/acceptance-qc-photo.jpg"],
        },
        store,
      );
      const shipment = await submitShipmentInfo(
        {
          task_id: task.task_id,
          carrier: "Acceptance Air",
          tracking_number: "ACCEPTANCE123",
          tracking_url: "https://example.com/track/ACCEPTANCE123",
          estimated_delivery: "5-8 days",
          shipping_notes: "Acceptance shipment only. No real package was shipped.",
        },
        store,
      );
      const completion = await completeTask(
        {
          task_id: task.task_id,
          completion_notes: "Acceptance task completed successfully.",
          proof_urls: ["https://example.com/acceptance-proof.jpg"],
        },
        store,
      );
      const finalTask = await getTask({ task_id: task.task_id }, store);

      const aiChecks = [
        check(
          "AI 能用英文引导全球用户准备素材",
          "用户端默认英文，并且不替用户生成图片。",
          artworkBrief.user_language === "en" &&
            artworkBrief.brief_text.includes("Use your own AI tool or designer"),
          artworkBrief.brief_text,
        ),
        check(
          "AI 能创建现实供应链任务",
          "产品名称、数量、材质、尺寸和素材链接被变成可追踪任务。",
          task.status === "created" &&
            task.recommended_execution_mode === "human_operator_required",
          `任务 ID：${task.task_id}\n状态：${task.status}\n执行模式：${task.recommended_execution_mode}`,
        ),
        check(
          "AI 能给用户展示英文订单草稿",
          "用户确认前看到的是英文订单摘要，不是生产端中文或数据库 JSON。",
          orderDraft.user_language === "en" &&
            orderDraft.user_confirmation_text.includes("Please confirm this order draft"),
          orderDraft.user_confirmation_text,
        ),
        check(
          "用户确认后才进入生产端",
          "系统保留人工确认优先，不会自动下单。",
          confirmation.status === "user_confirmed" &&
            confirmation.production_request?.status === "pending_operator_review",
          `用户确认状态：${confirmation.status}\n生产请求状态：${confirmation.production_request?.status}`,
        ),
        check(
          "AI 能拿到生产反馈",
          "AI 端能看到人工确认后的报价、打样费、交期和风险。",
          productionFeedback.status === "production_feedback_received" &&
            Boolean(productionFeedback.production_feedback.quote),
          `报价：${productionFeedback.production_feedback.quote}\n生产周期：${productionFeedback.production_feedback.estimated_production_time}\n物流周期：${productionFeedback.production_feedback.estimated_shipping_time}`,
        ),
      ];

      const operatorChecks = [
        check(
          "生产端收到中文生产需求单",
          "工厂/义乌 Reality Operator 看到的是中文。",
          orderDraft.production_request_preview_zh.includes("生产需求单") &&
            orderDraft.production_request_preview_zh.includes("价格必须人工确认"),
          orderDraft.production_request_preview_zh,
        ),
        check(
          "生产端收到中文询价文本",
          "发给供应商或市场人员的询价内容是中文，并明确价格需要人工确认。",
          quoteRequest.language === "zh" &&
            quoteRequest.quote_request_text.includes("价格需要人工确认"),
          quoteRequest.quote_request_text,
        ),
        check(
          "生产端能填写报价、打样费、交期和风险",
          "人工 Reality Operator 可以把现实反馈回传给 AI。",
          productionFeedback.production_feedback.feasible === true &&
            productionFeedback.production_feedback.risks.length > 0,
          `是否可做：是\n确认工艺：${productionFeedback.production_feedback.confirmed_process}\n报价：${productionFeedback.production_feedback.quote}\n风险：${productionFeedback.production_feedback.risks.join("；")}`,
        ),
        check(
          "付款是 mock，不处理真实支付",
          "当前只是本地流程验证，不会保存卡号，也不会真实扣款。",
          payment.payment_intent.provider === "mock" &&
            paymentConfirmation.status === "payment_confirmed",
          `支付类型：${payment.payment_intent.provider}\n支付链接：${payment.payment_intent.payment_url}\n确认状态：${paymentConfirmation.status}`,
        ),
        check(
          "生产、物流、完成状态能被记录",
          "生产端可以完成后续交付记录，AI 端能查询最终状态。",
          production.status === "quality_check" &&
            shipment.status === "shipped" &&
            completion.status === "completed" &&
            finalTask.status === "completed",
          `生产状态：${production.status}\n物流单号：${shipment.shipment.tracking_number}\n最终状态：${finalTask.status}`,
        ),
      ];

      const allChecks = [...aiChecks, ...operatorChecks];
      const passed = allChecks.filter((item) => item.pass).length;
      const failed = allChecks.length - passed;

      res.json({
        task_id: task.task_id,
        passed,
        failed,
        ai_checks: aiChecks,
        operator_checks: operatorChecks,
      });
    }),
  );
}
