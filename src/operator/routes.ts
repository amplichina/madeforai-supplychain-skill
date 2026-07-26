import type { Express, Request, Response } from "express";
import { getTask } from "../tools/getTask.js";
import { completeTask, submitShipmentInfo, updateProductionStatus } from "../tools/fulfillment.js";
import { submitProductionFeedback } from "../tools/submitProductionFeedback.js";
import { updateTaskStatus } from "../tools/updateTaskStatus.js";
import { uploadSampleResult } from "../tools/uploadSampleResult.js";
import type { SupplyChainStore } from "../tools/store.js";
import { operatorWorkspaceHtml } from "../ui/operatorWorkspace.js";
import type { OperatorAuth } from "./auth.js";

function asStringArray(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }
  if (typeof value !== "string") return undefined;

  const items = value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response) => void {
  return (req, res) => {
    handler(req, res).catch((error) => {
      res.status(400).json({
        error: error instanceof Error ? error.message : "生产端操作失败",
      });
    });
  };
}

function operatorConsoleHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI 生产端后台</title>
    <style>
      :root {
        --bg: #f5f7fb;
        --panel: #ffffff;
        --text: #17202a;
        --muted: #64748b;
        --line: #d9dee7;
        --accent: #0f766e;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      header {
        background: #111827;
        color: #ffffff;
        padding: 18px 24px;
      }
      header h1 { margin: 0; font-size: 22px; }
      header p { margin: 7px 0 0; color: #cbd5e1; font-size: 14px; }
      .header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .logout {
        border-color: #475569;
        background: transparent;
        color: #fff;
        white-space: nowrap;
      }
      main {
        display: grid;
        grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
        min-height: calc(100vh - 82px);
      }
      aside {
        border-right: 1px solid var(--line);
        background: #fff;
        overflow-y: auto;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
      }
      button {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text);
        border-radius: 6px;
        min-height: 36px;
        padding: 8px 11px;
        cursor: pointer;
        font-weight: 700;
      }
      button.primary {
        border-color: var(--accent);
        background: var(--accent);
        color: #fff;
      }
      .task-row {
        width: 100%;
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: #fff;
        text-align: left;
        padding: 13px 16px;
      }
      .task-row.active {
        background: #ecfdf5;
        border-left: 4px solid var(--accent);
        padding-left: 12px;
      }
      .task-title { display: block; font-size: 15px; font-weight: 800; line-height: 1.35; }
      .task-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        color: var(--muted);
        font-size: 12px;
      }
      .status {
        display: inline-flex;
        border-radius: 999px;
        background: #edf2f7;
        color: #334155;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 800;
      }
      .content { padding: 22px 24px 40px; overflow-y: auto; }
      .section {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .section h2 { margin: 0 0 12px; font-size: 20px; }
      .section h3 { margin: 0 0 10px; font-size: 16px; }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 11px 18px;
      }
      .field { border-bottom: 1px solid var(--line); padding-bottom: 8px; }
      .label { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
      .value { font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
      pre {
        margin: 0;
        overflow: auto;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        font-size: 12px;
        line-height: 1.5;
      }
      form { display: grid; gap: 10px; max-width: 860px; }
      label { display: grid; gap: 5px; font-size: 13px; font-weight: 800; }
      input, select, textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 8px 10px;
        font: inherit;
        background: #fff;
      }
      textarea { min-height: 78px; resize: vertical; }
      .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
      .full { grid-column: 1 / -1; }
      .notice {
        border-left: 5px solid var(--accent);
        background: #ecfdf5;
        padding: 12px 14px;
        margin-bottom: 16px;
        color: #064e3b;
        font-size: 14px;
        line-height: 1.6;
      }
      .empty { padding: 22px; color: var(--muted); }
      .danger { color: var(--danger); }
      @media (max-width: 900px) {
        main { grid-template-columns: 1fr; }
        aside { border-right: 0; border-bottom: 1px solid var(--line); max-height: 42vh; }
        .grid, .form-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="header-row">
        <h1>MadeForAI 生产端后台</h1>
        <button id="logout" class="logout" type="button">退出登录</button>
      </div>
      <p>供义乌 Reality Operator、工厂对接人员、供应链执行人员使用：查看中文生产需求单，填写报价、打样、交期、样品、生产、物流和交付结果。</p>
    </header>
    <main>
      <aside>
        <div class="toolbar">
          <strong>生产任务</strong>
          <button id="refreshTasks" type="button">刷新</button>
        </div>
        <div id="taskList"><div class="empty">正在加载任务...</div></div>
      </aside>
      <section class="content">
        <div id="detail"><div class="empty">请选择左侧任务，查看生产需求和填写反馈。</div></div>
      </section>
    </main>
    <script>
      let selectedTaskId = null;
      let tasks = [];
      const statuses = [
        "created", "operator_reviewing", "quote_requested", "quote_received",
        "sample_ordered", "sample_ready", "order_draft_created", "user_confirmed",
        "production_requested", "production_feedback_received", "payment_link_created",
        "payment_confirmed", "production_ready", "production_in_progress",
        "quality_check", "user_rejected", "shipped", "completed", "cancelled"
      ];
      const statusNames = {
        created: "已创建",
        operator_reviewing: "人工审核中",
        quote_requested: "已发起询价",
        quote_received: "已收到报价",
        sample_ordered: "已安排打样",
        sample_ready: "样品已完成",
        order_draft_created: "订单草稿已生成",
        user_confirmed: "用户已确认",
        production_requested: "已提交生产端",
        production_feedback_received: "已收到生产反馈",
        payment_link_created: "已生成支付链接",
        payment_confirmed: "支付已确认",
        production_ready: "待生产",
        production_in_progress: "生产中",
        quality_check: "质检中",
        user_rejected: "用户已拒绝",
        shipped: "已发货",
        completed: "已完成",
        cancelled: "已取消"
      };
      const categoryNames = {
        badge: "徽章",
        acrylic: "亚克力制品",
        card: "卡片印刷",
        packaging_card: "包装卡",
        sticker: "贴纸",
        print_collateral: "宣传印刷品",
        exhibition_display: "展会与门店物料",
        apparel: "服装与工服",
        small_batch_merch: "小批量周边",
        other: "定制产品"
      };
      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
      }
      function field(label, value) {
        return '<div class="field"><span class="label">' + escapeHtml(label) + '</span><div class="value">' + escapeHtml(value ?? "-") + '</div></div>';
      }
      function jsonBlock(value) {
        return '<pre>' + escapeHtml(JSON.stringify(value ?? null, null, 2)) + '</pre>';
      }
      function hasChinese(value) {
        return /[\\u4e00-\\u9fff]/.test(String(value || ""));
      }
      function displayTaskName(task) {
        if (hasChinese(task.product_name)) return task.product_name;
        if (hasChinese(task.title)) return task.title;
        const category = categoryNames[task.category] || "定制产品";
        const quantity = task.quantity ? "，数量：" + task.quantity : "";
        return category + "生产任务" + quantity;
      }
      function chineseRequirementSummary(task) {
        const lines = [
          "产品类型：" + (categoryNames[task.category] || "定制产品"),
          "数量：" + (task.quantity ?? "待确认"),
          "材质：" + (task.material || "待确认"),
          "尺寸：" + (task.dimensions || "待确认"),
          "工艺：" + (task.process || "待确认"),
          "颜色要求：" + (task.color_requirements || "待确认"),
          "包装要求：" + (task.packaging_requirements || "待确认"),
          "图稿要求：" + (task.artwork_requirements || "待确认"),
          "发货目的地：" + (task.shipping_destination || "待确认")
        ];
        return lines.join("\\n");
      }
      function productionRequestText(task) {
        return task.production_request?.production_request_text_zh ||
          task.order_draft?.production_request_preview_zh ||
          "暂无中文生产需求单。请先由 AI 端生成订单草稿，并在用户确认后提交到生产端。";
      }
      async function api(path, options = {}) {
        const response = await fetch(path, { headers: { "content-type": "application/json" }, ...options });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "请求失败");
        return payload;
      }
      async function loadTasks() {
        tasks = await api("/operator/api/tasks");
        const list = document.getElementById("taskList");
        if (tasks.length === 0) {
          list.innerHTML = '<div class="empty">暂无任务。请先让 AI 客户端创建 MadeForAI 供应链任务。</div>';
          return;
        }
        list.innerHTML = tasks.map((task) => {
          const active = task.task_id === selectedTaskId ? " active" : "";
          const statusText = statusNames[task.status] || task.status;
          return '<button class="task-row' + active + '" type="button" data-task-id="' + escapeHtml(task.task_id) + '">' +
            '<span class="task-title">' + escapeHtml(displayTaskName(task)) + '</span>' +
            '<span class="task-meta"><span class="status">' + escapeHtml(statusText) + '</span><span>' + escapeHtml(task.category) + '</span><span>数量：' + escapeHtml(task.quantity ?? "-") + '</span></span>' +
            '</button>';
        }).join("");
        list.querySelectorAll("[data-task-id]").forEach((button) => {
          button.addEventListener("click", () => selectTask(button.dataset.taskId));
        });
      }
      async function selectTask(taskId) {
        selectedTaskId = taskId;
        await loadTasks();
        const task = await api("/operator/api/tasks/" + encodeURIComponent(taskId));
        renderDetail(task);
      }
      function renderDetail(task) {
        const statusOptions = statuses.map((status) => '<option value="' + status + '"' + (task.status === status ? " selected" : "") + '>' + (statusNames[status] || status) + '</option>').join("");
        document.getElementById("detail").innerHTML = \`
          <div class="notice">生产端只负责人工确认和回传结果。价格、工艺、交期、质量和物流必须人工确认；当前系统不会自动下单，也不会处理真实支付。</div>
          <div class="section">
            <h2>\${escapeHtml(displayTaskName(task))}</h2>
            <div class="grid">
              \${field("任务编号", task.task_id)}
              \${field("当前状态", statusNames[task.status] || task.status)}
              \${field("产品类别", categoryNames[task.category] || task.category)}
              \${field("数量", task.quantity)}
              \${field("材质", task.material)}
              \${field("尺寸", task.dimensions)}
              \${field("工艺", task.process)}
              \${field("发货目的地", task.shipping_destination)}
              \${field("预算范围", task.budget_range)}
              \${field("颜色要求", task.color_requirements)}
              \${field("包装要求", task.packaging_requirements)}
              \${field("图稿要求", task.artwork_requirements)}
              \${field("中文需求摘要", chineseRequirementSummary(task))}
              \${field("备注", task.notes)}
            </div>
          </div>
          <div class="section">
            <h3>中文生产需求单</h3>
            <pre>\${escapeHtml(productionRequestText(task))}</pre>
          </div>
          <div class="section">
            <h3>订单草稿</h3>
            \${jsonBlock(task.order_draft)}
          </div>
          <div class="section">
            <h3>AI 原始需求（仅供核对）</h3>
            <div class="grid">
              \${field("原始产品名称", task.product_name || task.title)}
              \${field("原始需求说明", task.description)}
            </div>
          </div>
          <div class="section">
            <h3>生产端反馈记录</h3>
            \${jsonBlock(task.production_feedback)}
          </div>
          <div class="section">
            <h3>支付确认记录</h3>
            \${jsonBlock(task.payment_intent)}
          </div>
          <div class="section">
            <h3>生产/物流/交付记录</h3>
            \${jsonBlock(task.fulfillment)}
          </div>
          <div class="section">
            <h3>最新样品结果</h3>
            \${jsonBlock(task.sample_result)}
          </div>
          <div class="section">
            <h3>更新任务状态</h3>
            <form id="statusForm">
              <div class="form-grid">
                <label>状态<select name="status">\${statusOptions}</select></label>
                <label class="full">备注<textarea name="message" placeholder="填写给内部生产端看的备注"></textarea></label>
              </div>
              <button class="primary" type="submit">保存状态</button>
            </form>
          </div>
          <div class="section">
            <h3>填写生产反馈</h3>
            <form id="feedbackForm">
              <div class="form-grid">
                <label>是否可做<select name="feasible"><option value="true">可以做</option><option value="false">暂不可做</option></select></label>
                <label>报价<input name="quote" placeholder="例如：人工确认价 RMB 2.60/个，300 个起" /></label>
                <label>打样费<input name="sample_cost" placeholder="例如：人工确认打样费 RMB 120" /></label>
                <label>生产周期<input name="estimated_production_time" placeholder="例如：打样确认后 5-7 天" /></label>
                <label>物流周期<input name="estimated_shipping_time" placeholder="例如：空运 5-8 天" /></label>
                <label>确认工艺<input name="confirmed_process" placeholder="例如：350g 铜版纸覆哑膜，模切" /></label>
                <label class="full">需要用户补充的信息<textarea name="required_clarifications" placeholder="一行一条"></textarea></label>
                <label class="full">质量/交付风险<textarea name="risks" placeholder="一行一条"></textarea></label>
                <label class="full">生产端备注<textarea name="operator_notes"></textarea></label>
              </div>
              <button class="primary" type="submit">提交生产反馈</button>
            </form>
          </div>
          <div class="section">
            <h3>上传样品结果</h3>
            <form id="sampleForm">
              <div class="form-grid">
                <label class="full">样品图片链接<textarea name="sample_images" placeholder="一行一个 URL"></textarea></label>
                <label class="full">样品视频链接<textarea name="sample_videos" placeholder="一行一个 URL"></textarea></label>
                <label>最终报价<input name="quoted_price" /></label>
                <label>预计生产时间<input name="production_time" /></label>
                <label class="full">供应商反馈<textarea name="supplier_feedback"></textarea></label>
                <label class="full">质量备注<textarea name="quality_notes"></textarea></label>
                <label class="full">物流信息<textarea name="shipping_info"></textarea></label>
              </div>
              <button class="primary" type="submit">保存样品结果</button>
            </form>
          </div>
          <div class="section">
            <h3>更新生产进度</h3>
            <form id="productionForm">
              <div class="form-grid">
                <label>生产阶段<select name="stage"><option value="production_ready">待生产</option><option value="production_in_progress">生产中</option><option value="quality_check">质检中</option></select></label>
                <label class="full">进度说明<textarea name="message"></textarea></label>
                <label class="full">生产照片链接<textarea name="production_photos" placeholder="一行一个 URL"></textarea></label>
                <label class="full">生产端备注<textarea name="operator_notes"></textarea></label>
              </div>
              <button class="primary" type="submit">保存生产进度</button>
            </form>
          </div>
          <div class="section">
            <h3>填写发货信息</h3>
            <form id="shipmentForm">
              <div class="form-grid">
                <label>承运商<input name="carrier" /></label>
                <label>物流单号<input name="tracking_number" /></label>
                <label class="full">物流查询链接<input name="tracking_url" /></label>
                <label>发货时间<input name="shipped_at" placeholder="可填日期或时间戳" /></label>
                <label>预计送达<input name="estimated_delivery" /></label>
                <label class="full">发货备注<textarea name="shipping_notes"></textarea></label>
              </div>
              <button class="primary" type="submit">提交发货信息</button>
            </form>
          </div>
          <div class="section">
            <h3>确认交付完成</h3>
            <form id="completionForm">
              <div class="form-grid">
                <label>交付时间<input name="delivered_at" placeholder="可填日期或时间戳" /></label>
                <label class="full">交付凭证链接<textarea name="proof_urls" placeholder="一行一个 URL"></textarea></label>
                <label class="full">完成备注<textarea name="completion_notes"></textarea></label>
              </div>
              <button class="primary" type="submit">标记为完成</button>
            </form>
          </div>
          <div class="section">
            <h3>任务历史</h3>
            \${jsonBlock(task.history)}
          </div>
        \`;
        document.getElementById("statusForm").addEventListener("submit", submitStatus);
        document.getElementById("feedbackForm").addEventListener("submit", submitFeedback);
        document.getElementById("sampleForm").addEventListener("submit", submitSample);
        document.getElementById("productionForm").addEventListener("submit", submitProduction);
        document.getElementById("shipmentForm").addEventListener("submit", submitShipment);
        document.getElementById("completionForm").addEventListener("submit", submitCompletion);
      }
      function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
      function splitLines(value) {
        return String(value || "").split(/\\r?\\n|,/).map((item) => item.trim()).filter(Boolean);
      }
      async function submitStatus(event) {
        event.preventDefault();
        const data = formData(event.currentTarget);
        await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/status", {
          method: "POST",
          body: JSON.stringify({ status: data.status, message: data.message || undefined })
        });
        await selectTask(selectedTaskId);
      }
      async function submitFeedback(event) {
        event.preventDefault();
        const data = formData(event.currentTarget);
        await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/production-feedback", {
          method: "POST",
          body: JSON.stringify({
            feasible: data.feasible === "true",
            confirmed_process: data.confirmed_process || undefined,
            quote: data.quote || undefined,
            sample_cost: data.sample_cost || undefined,
            estimated_production_time: data.estimated_production_time || undefined,
            estimated_shipping_time: data.estimated_shipping_time || undefined,
            required_clarifications: splitLines(data.required_clarifications),
            risks: splitLines(data.risks),
            operator_notes: data.operator_notes || undefined
          })
        });
        await selectTask(selectedTaskId);
      }
      async function submitSample(event) {
        event.preventDefault();
        const data = formData(event.currentTarget);
        await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/sample-result", {
          method: "POST",
          body: JSON.stringify({
            sample_images: splitLines(data.sample_images),
            sample_videos: splitLines(data.sample_videos),
            quoted_price: data.quoted_price || undefined,
            production_time: data.production_time || undefined,
            supplier_feedback: data.supplier_feedback || undefined,
            quality_notes: data.quality_notes || undefined,
            shipping_info: data.shipping_info || undefined
          })
        });
        await selectTask(selectedTaskId);
      }
      async function submitProduction(event) {
        event.preventDefault();
        const data = formData(event.currentTarget);
        await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/production-status", {
          method: "POST",
          body: JSON.stringify({
            stage: data.stage,
            message: data.message || undefined,
            production_photos: splitLines(data.production_photos),
            operator_notes: data.operator_notes || undefined
          })
        });
        await selectTask(selectedTaskId);
      }
      async function submitShipment(event) {
        event.preventDefault();
        const data = formData(event.currentTarget);
        await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/shipment", {
          method: "POST",
          body: JSON.stringify({
            carrier: data.carrier || undefined,
            tracking_number: data.tracking_number || undefined,
            tracking_url: data.tracking_url || undefined,
            shipped_at: data.shipped_at || undefined,
            estimated_delivery: data.estimated_delivery || undefined,
            shipping_notes: data.shipping_notes || undefined
          })
        });
        await selectTask(selectedTaskId);
      }
      async function submitCompletion(event) {
        event.preventDefault();
        const data = formData(event.currentTarget);
        await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/complete", {
          method: "POST",
          body: JSON.stringify({
            delivered_at: data.delivered_at || undefined,
            completion_notes: data.completion_notes || undefined,
            proof_urls: splitLines(data.proof_urls)
          })
        });
        await selectTask(selectedTaskId);
      }
      document.getElementById("refreshTasks").addEventListener("click", loadTasks);
      document.getElementById("logout").addEventListener("click", async () => {
        await fetch("/operator/logout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}"
        });
        window.location.replace("/operator/login");
      });
      loadTasks().catch((error) => {
        document.getElementById("taskList").innerHTML = '<div class="empty danger">' + escapeHtml(error.message) + '</div>';
      });
    </script>
  </body>
</html>`;
}

export function registerOperatorRoutes(
  app: Express,
  store: SupplyChainStore,
  auth: OperatorAuth,
): void {
  app.get("/operator/login", auth.showLogin);
  app.post("/operator/login", auth.login);
  app.post("/operator/logout", auth.requireAuth, auth.logout);
  app.use("/operator", auth.requireAuth);

  app.get("/operator", (_req, res) => {
    res.type("html").send(operatorWorkspaceHtml());
  });

  app.get("/operator/legacy", (_req, res) => {
    res.type("html").send(operatorConsoleHtml());
  });

  app.get(
    "/operator/api/tasks",
    asyncHandler(async (_req, res) => {
      const tasks = await store.listTasks();
      res.json(
        tasks.map((task) => ({
          task_id: task.id,
          title: task.title,
          category: task.productCategory,
          product_name: task.productName,
          status: task.status,
          quantity: task.quantity,
          updated_at: task.updatedAt.toISOString(),
          created_at: task.createdAt.toISOString(),
        })),
      );
    }),
  );

  app.get(
    "/operator/api/tasks/:taskId",
    asyncHandler(async (req, res) => {
      res.json(await getTask({ task_id: req.params.taskId }, store));
    }),
  );

  app.post(
    "/operator/api/tasks/:taskId/status",
    asyncHandler(async (req, res) => {
      res.json(
        await updateTaskStatus(
          {
            task_id: req.params.taskId,
            status: req.body.status,
            message: req.body.message,
          },
          store,
        ),
      );
    }),
  );

  app.post(
    "/operator/api/tasks/:taskId/production-feedback",
    asyncHandler(async (req, res) => {
      res.json(
        await submitProductionFeedback(
          {
            task_id: req.params.taskId,
            feasible: req.body.feasible,
            confirmed_process: req.body.confirmed_process,
            quote: req.body.quote,
            total_amount: req.body.total_amount,
            currency: req.body.currency,
            sample_cost: req.body.sample_cost,
            estimated_production_time: req.body.estimated_production_time,
            estimated_shipping_time: req.body.estimated_shipping_time,
            required_clarifications: asStringArray(req.body.required_clarifications),
            risks: asStringArray(req.body.risks),
            operator_notes: req.body.operator_notes,
          },
          store,
        ),
      );
    }),
  );

  app.post(
    "/operator/api/tasks/:taskId/sample-result",
    asyncHandler(async (req, res) => {
      res.json(
        await uploadSampleResult(
          {
            task_id: req.params.taskId,
            sample_images: asStringArray(req.body.sample_images),
            sample_videos: asStringArray(req.body.sample_videos),
            quoted_price: req.body.quoted_price,
            production_time: req.body.production_time,
            supplier_feedback: req.body.supplier_feedback,
            quality_notes: req.body.quality_notes,
            shipping_info: req.body.shipping_info,
          },
          store,
        ),
      );
    }),
  );

  app.post(
    "/operator/api/tasks/:taskId/production-status",
    asyncHandler(async (req, res) => {
      res.json(
        await updateProductionStatus(
          {
            task_id: req.params.taskId,
            stage: req.body.stage,
            message: req.body.message,
            production_photos: asStringArray(req.body.production_photos),
            operator_notes: req.body.operator_notes,
          },
          store,
        ),
      );
    }),
  );

  app.post(
    "/operator/api/tasks/:taskId/shipment",
    asyncHandler(async (req, res) => {
      res.json(
        await submitShipmentInfo(
          {
            task_id: req.params.taskId,
            carrier: req.body.carrier,
            tracking_number: req.body.tracking_number,
            tracking_url: req.body.tracking_url,
            shipped_at: req.body.shipped_at,
            estimated_delivery: req.body.estimated_delivery,
            shipping_notes: req.body.shipping_notes,
          },
          store,
        ),
      );
    }),
  );

  app.post(
    "/operator/api/tasks/:taskId/complete",
    asyncHandler(async (req, res) => {
      res.json(
        await completeTask(
          {
            task_id: req.params.taskId,
            delivered_at: req.body.delivered_at,
            completion_notes: req.body.completion_notes,
            proof_urls: asStringArray(req.body.proof_urls),
          },
          store,
        ),
      );
    }),
  );
}
