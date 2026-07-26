export function operatorWorkspaceHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI · 生产执行台</title>
    <style>
      :root {
        --bg: #f3f5f4;
        --surface: #fff;
        --soft: #f8faf9;
        --ink: #17201f;
        --muted: #687370;
        --line: #dce3e1;
        --brand: #087c69;
        --brand-dark: #065f52;
        --brand-soft: #e7f5f1;
        --blue: #2563eb;
        --amber: #b54708;
        --amber-soft: #fff5e8;
        --red: #b42318;
        --green: #067647;
        --shadow: 0 8px 24px rgba(24, 42, 38, .07);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-width: 320px;
        background: var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      button, input, textarea, select { font: inherit; }
      button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, a:focus-visible {
        outline: 3px solid rgba(8, 124, 105, .22);
        outline-offset: 2px;
      }
      .topbar {
        height: 62px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        background: #13201e;
        color: #fff;
        border-bottom: 1px solid #263936;
      }
      .brand { display: flex; align-items: center; gap: 10px; }
      .mark { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid #4f756e; border-radius: 7px; color: #8fe0cf; font-weight: 900; }
      .brand strong { display: block; font-size: 15px; }
      .brand span { display: block; margin-top: 2px; color: #9eb1ad; font-size: 11px; }
      .top-actions { display: flex; align-items: center; gap: 10px; }
      .top-actions a, .logout {
        min-height: 34px;
        padding: 7px 10px;
        border: 1px solid #405854;
        border-radius: 6px;
        background: transparent;
        color: #dce7e4;
        text-decoration: none;
        font-weight: 700;
        cursor: pointer;
      }
      .app {
        height: calc(100vh - 62px);
        display: grid;
        grid-template-columns: 344px minmax(0, 1fr);
      }
      .queue {
        min-width: 0;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--line);
        background: var(--surface);
      }
      .queue-head { padding: 15px; border-bottom: 1px solid var(--line); }
      .queue-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .queue-title h1 { margin: 0; font-size: 17px; }
      .count { min-width: 27px; padding: 3px 7px; border-radius: 999px; background: var(--brand-soft); color: var(--brand-dark); text-align: center; font-size: 11px; font-weight: 900; }
      .search { position: relative; margin-top: 12px; }
      .search input { width: 100%; height: 38px; padding: 8px 10px 8px 32px; border: 1px solid var(--line); border-radius: 6px; background: var(--soft); color: var(--ink); }
      .search::before { content: "⌕"; position: absolute; left: 11px; top: 8px; color: var(--muted); }
      .filters { margin-top: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 3px; border-radius: 7px; background: #edf1f0; }
      .filter { min-height: 30px; padding: 5px 4px; border: 0; border-radius: 5px; background: transparent; color: var(--muted); font-size: 11px; font-weight: 800; cursor: pointer; }
      .filter.active { background: #fff; color: var(--ink); box-shadow: 0 1px 4px rgba(20, 34, 31, .1); }
      .task-list { flex: 1; overflow-y: auto; padding: 7px; }
      .task-row {
        width: 100%;
        min-height: 94px;
        margin-bottom: 5px;
        padding: 11px;
        display: block;
        border: 1px solid transparent;
        border-radius: 7px;
        background: transparent;
        color: var(--ink);
        text-align: left;
        cursor: pointer;
      }
      .task-row:hover { background: var(--soft); }
      .task-row.active { border-color: #a9d4ca; background: var(--brand-soft); }
      .task-row-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
      .task-row strong { min-width: 0; font-size: 13px; line-height: 1.4; overflow-wrap: anywhere; }
      .task-row time { flex: 0 0 auto; color: var(--muted); font-size: 10px; }
      .task-meta { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px; color: var(--muted); font-size: 10px; }
      .task-meta span { padding: 3px 5px; border: 1px solid var(--line); border-radius: 4px; background: #fff; }
      .status-dot { margin-top: 9px; display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 11px; }
      .status-dot::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--amber); }
      .status-dot.production::before { background: var(--blue); }
      .status-dot.done::before { background: var(--green); }
      .workspace { min-width: 0; overflow-y: auto; }
      .empty {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
        color: var(--muted);
      }
      .empty-mark { width: 58px; height: 58px; margin: 0 auto 14px; display: grid; place-items: center; border: 1px dashed #aab8b4; border-radius: 8px; color: var(--brand); font-weight: 900; }
      .detail-head {
        position: sticky;
        top: 0;
        z-index: 4;
        padding: 15px 22px 0;
        background: rgba(243, 245, 244, .96);
        backdrop-filter: blur(10px);
      }
      .title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
      .title-row h2 { margin: 0; font-size: 21px; line-height: 1.35; }
      .task-id { margin-top: 4px; color: var(--muted); font: 10px ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap: anywhere; }
      .status-select { min-width: 140px; height: 36px; border: 1px solid var(--line); border-radius: 6px; padding: 0 9px; background: #fff; color: var(--ink); font-weight: 700; }
      .tabs { margin-top: 14px; display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--line); }
      .tab { min-height: 40px; padding: 8px 11px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); white-space: nowrap; font-weight: 800; cursor: pointer; }
      .tab.active { color: var(--brand-dark); border-bottom-color: var(--brand); }
      .detail-body { width: min(1120px, 100%); padding: 18px 22px 44px; }
      .next-action {
        margin-bottom: 16px;
        padding: 14px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
        align-items: center;
        border: 1px solid #f0d5b5;
        border-left: 4px solid var(--amber);
        border-radius: 7px;
        background: var(--amber-soft);
      }
      .next-action b { display: block; color: #7a2e0e; font-size: 14px; }
      .next-action p { margin: 4px 0 0; color: #8a4a22; font-size: 12px; line-height: 1.5; }
      .quick-bar {
        margin: 0 0 16px;
        padding: 12px 14px;
        border: 1px solid #a9d4ca;
        border-left: 4px solid var(--brand);
        border-radius: 8px;
        background: var(--brand-soft);
      }
      .quick-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 9px; }
      .quick-head b { color: var(--brand-dark); font-size: 14px; }
      .quick-head span { color: #35665d; font-size: 11px; }
      .quick-fields { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; }
      .quick-fields input { flex: 1 1 180px; min-width: 0; }
      button {
        min-height: 36px;
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        font-weight: 800;
        cursor: pointer;
      }
      button.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
      button.primary:hover { background: var(--brand-dark); }
      button:disabled { opacity: .55; cursor: wait; }
      .summary-strip { margin-bottom: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); background: #fff; }
      .summary-item { min-width: 0; padding: 11px 12px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
      .summary-item span { display: block; margin-bottom: 4px; color: var(--muted); font-size: 10px; }
      .summary-item strong { display: block; font-size: 13px; overflow-wrap: anywhere; }
      .panel { display: none; }
      .panel.active { display: block; animation: enter .18s ease; }
      @keyframes enter { from { opacity: .3; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      .section {
        margin-bottom: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        overflow: hidden;
        box-shadow: var(--shadow);
      }
      .section-head { min-height: 48px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--line); }
      .section-head h3 { margin: 0; font-size: 14px; }
      .section-head span { color: var(--muted); font-size: 11px; }
      .section-body { padding: 14px; }
      .kv { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
      .field { min-width: 0; padding: 10px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
      .field.full { grid-column: 1 / -1; }
      .field span { display: block; margin-bottom: 4px; color: var(--muted); font-size: 10px; }
      .field strong { display: block; font-size: 13px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
      .production-sheet {
        margin: 0;
        padding: 15px;
        border: 1px solid #cdd9d6;
        border-left: 4px solid var(--brand);
        border-radius: 7px;
        background: #fbfdfc;
        font: 13px/1.8 ui-monospace, SFMono-Regular, Consolas, "Microsoft YaHei", monospace;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
      label { display: grid; gap: 5px; color: #45514e; font-size: 11px; font-weight: 800; }
      label.full { grid-column: 1 / -1; }
      input, textarea, select {
        width: 100%;
        border: 1px solid #cbd5d2;
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        padding: 9px 10px;
      }
      textarea { min-height: 74px; resize: vertical; line-height: 1.5; }
      .field-hint { color: var(--muted); font-size: 10px; font-weight: 500; line-height: 1.5; }
      .form-actions { margin-top: 12px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
      .readiness { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip { padding: 4px 7px; border-radius: 999px; background: var(--brand-soft); color: var(--brand-dark); font-size: 10px; font-weight: 800; }
      .chip.warn { background: var(--amber-soft); color: var(--amber); }
      .timeline { display: grid; gap: 0; }
      .event { position: relative; padding: 4px 0 17px 28px; }
      .event::before { content: ""; position: absolute; left: 7px; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: var(--brand); }
      .event::after { content: ""; position: absolute; left: 10px; top: 17px; bottom: 0; width: 1px; background: var(--line); }
      .event:last-child::after { display: none; }
      .event b { display: block; font-size: 12px; }
      .event p { margin: 3px 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
      .event time { color: #88928f; font-size: 10px; }
      details { border: 1px solid var(--line); border-radius: 7px; background: var(--soft); }
      summary { padding: 10px 12px; cursor: pointer; color: var(--muted); font-size: 11px; font-weight: 800; }
      pre.raw { margin: 0; padding: 12px; border-top: 1px solid var(--line); overflow: auto; font-size: 10px; white-space: pre-wrap; }
      .empty-inline { padding: 20px; text-align: center; color: var(--muted); font-size: 12px; }
      .toast { position: fixed; right: 18px; bottom: 18px; z-index: 20; max-width: 360px; padding: 11px 14px; border-radius: 7px; background: #17201f; color: #fff; box-shadow: var(--shadow); font-size: 13px; transform: translateY(18px); opacity: 0; pointer-events: none; transition: .2s ease; }
      .toast.show { transform: none; opacity: 1; }
      .toast.error { background: var(--red); }
      @media (max-width: 900px) {
        .app { height: auto; min-height: calc(100vh - 62px); grid-template-columns: 1fr; }
        .queue { max-height: 390px; border-right: 0; border-bottom: 1px solid var(--line); }
        .task-list { max-height: 245px; }
        .workspace { overflow: visible; }
        .detail-head { position: static; }
      }
      @media (max-width: 620px) {
        .topbar { padding: 0 12px; }
        .top-actions a { display: none; }
        .queue-head { padding: 12px; }
        .detail-head { padding: 14px 12px 0; }
        .detail-body { padding: 12px 12px 30px; }
        .title-row { display: grid; }
        .status-select { width: 100%; }
        .summary-strip { grid-template-columns: 1fr 1fr; }
        .next-action { grid-template-columns: 1fr; }
        .kv, .form-grid { grid-template-columns: 1fr; }
        .field.full, label.full { grid-column: auto; }
        button, .status-select { min-height: 44px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <div class="brand"><div class="mark">M</div><div><strong>MadeForAI</strong><span>现实供应链生产执行台</span></div></div>
      <div class="top-actions"><a href="/user">查看用户端</a><button class="logout" id="logout" type="button">退出登录</button></div>
    </header>
    <main class="app">
      <aside class="queue">
        <div class="queue-head">
          <div class="queue-title"><h1>任务队列</h1><span class="count" id="taskCount">0</span></div>
          <div class="search"><input id="search" type="search" placeholder="搜索产品、任务号或状态" aria-label="搜索任务" /></div>
          <div class="filters" role="tablist">
            <button class="filter active" data-filter="action" type="button">待我处理</button>
            <button class="filter" data-filter="waiting" type="button">等待对方</button>
            <button class="filter" data-filter="production" type="button">生产中</button>
            <button class="filter" data-filter="done" type="button">已结束</button>
          </div>
        </div>
        <div class="task-list" id="taskList"><div class="empty-inline">正在加载任务…</div></div>
      </aside>
      <section class="workspace" id="workspace">
        <div class="empty"><div><div class="empty-mark">TASK</div><strong>从左侧选择一个生产任务</strong><p>系统会根据当前状态告诉你此刻最需要完成的动作。</p></div></div>
      </section>
    </main>
    <div class="toast" id="toast" role="status"></div>
    <script>
      const statusNames = {
        created:"新任务", operator_reviewing:"审核中", quote_requested:"待询价", quote_received:"已报价",
        sample_ordered:"已下样", sample_ready:"样品就绪", shipped:"已发货", completed:"已完成", cancelled:"已取消",
        order_draft_created:"待用户确认", production_request_created:"待生产审核", production_feedback_received:"反馈已回传",
        payment_link_created:"待付款", payment_confirmed:"已付款待生产", production_ready:"待生产",
        production_in_progress:"生产中", quality_check:"质检中"
      };
      const categoryNames = { badge:"徽章", acrylic:"亚克力制品", card:"卡片", packaging_card:"包装卡", sticker:"贴纸", print_collateral:"宣传印刷品", exhibition_display:"展会与门店物料", apparel:"服装与工服", small_batch_merch:"小批量周边", other:"其他定制品" };
      let tasks = [], selectedTaskId = null, activeFilter = "action", activeTab = "requirement";
      function esc(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
      function fmt(value) { return value === null || value === undefined || value === "" ? "待确认" : String(value); }
      function date(value) { if (!value) return ""; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("zh-CN", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }); }
      async function api(path, options) {
        const response = await fetch(path, { headers: { "content-type":"application/json" }, ...(options || {}) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "操作失败");
        return payload;
      }
      function notify(text, error) {
        const node = document.getElementById("toast");
        node.textContent = text; node.className = "toast show" + (error ? " error" : "");
        window.setTimeout(() => node.className = "toast", 2400);
      }
      function group(status) {
        if (["completed","cancelled"].includes(status)) return "done";
        if (["payment_confirmed","production_ready","production_in_progress","quality_check","shipped"].includes(status)) return "production";
        if (["order_draft_created","production_feedback_received","payment_link_created"].includes(status)) return "waiting";
        return "action";
      }
      function displayName(task) { return task.order_draft?.production_title_zh || (categoryNames[task.category] || "定制产品") + "生产任务"; }
      function zhSpec(task, field) { return task.order_draft?.production_spec_zh?.[field] || "待 AI 客户端提供中文译文"; }
      function renderTasks() {
        const query = document.getElementById("search").value.trim().toLowerCase();
        const visible = tasks
          .filter((task) => group(task.status) === activeFilter && [displayName(task), task.task_id, statusNames[task.status] || task.status].join(" ").toLowerCase().includes(query))
          .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        document.getElementById("taskCount").textContent = String(visible.length);
        document.getElementById("taskList").innerHTML = visible.length ? visible.map((task) =>
          '<button class="task-row' + (task.task_id === selectedTaskId ? " active" : "") + '" data-task-id="' + esc(task.task_id) + '" type="button">' +
          '<span class="task-row-top"><strong>' + esc(displayName(task)) + '</strong><time>' + esc(date(task.updated_at)) + '</time></span>' +
          '<span class="task-meta"><span>' + esc(categoryNames[task.category] || task.category) + '</span><span>' + esc(task.quantity || "数量待定") + ' 件</span></span>' +
          '<span class="status-dot ' + group(task.status) + '">' + esc(statusNames[task.status] || task.status) + '</span></button>'
        ).join("") : '<div class="empty-inline">这个队列里暂时没有任务</div>';
        document.querySelectorAll("[data-task-id]").forEach((node) => node.addEventListener("click", () => selectTask(node.dataset.taskId)));
      }
      async function loadTasks() {
        tasks = await api("/operator/api/tasks");
        renderTasks();
        if (!selectedTaskId) {
          const preferred = tasks.find((task) => group(task.status) === activeFilter) || tasks[0];
          if (preferred) await selectTask(preferred.task_id);
        }
      }
      function field(label, value, full) { return '<div class="field' + (full ? " full" : "") + '"><span>' + esc(label) + '</span><strong>' + esc(fmt(value)) + '</strong></div>'; }
      function statusOptions(task) {
        const nextByStatus = {
          created:["operator_reviewing","quote_requested","cancelled"],
          operator_reviewing:["quote_requested","cancelled"],
          quote_requested:["operator_reviewing","cancelled"],
          quote_received:["cancelled"], sample_ordered:["cancelled"], sample_ready:["cancelled"],
          order_draft_created:["cancelled"], user_confirmed:["cancelled"],
          production_requested:["cancelled"], production_request_created:["cancelled"],
          production_feedback_received:["cancelled"], payment_link_created:["cancelled"],
          payment_confirmed:["cancelled"], production_ready:["cancelled"],
          production_in_progress:["cancelled"], quality_check:["cancelled"],
          user_rejected:["cancelled"], shipped:["cancelled"]
        };
        const available = [task.status].concat(nextByStatus[task.status] || []);
        return available.map((status) => '<option value="' + status + '"' + (task.status === status ? " selected" : "") + '>' + esc(statusNames[status] || status) + '</option>').join("");
      }
      function productionText(task) {
        return task.production_request?.production_request_text_zh || task.order_draft?.production_request_preview_zh ||
          ["产品名称：" + displayName(task), "产品类别：" + (categoryNames[task.category] || task.category), "数量：" + fmt(task.quantity), "材质：" + fmt(task.material), "尺寸：" + fmt(task.dimensions), "工艺：" + fmt(task.process), "发货目的地：" + fmt(task.shipping_destination), "注意：价格、交期与工艺必须人工确认。"].join("\\n");
      }
      function quickBar(task) {
        const action = quickAction(task);
        if (!action) return "";
        return '<form class="quick-bar" id="' + action.id + '"><div class="quick-head"><b>' + esc(action.label) + '</b><span>' + esc(action.hint) + '</span></div><div class="quick-fields">' + action.fields + '<button class="primary" type="submit">' + esc(action.button) + '</button></div></form>';
      }
      function quickAction(task) {
        if (task.status === "production_requested" || task.status === "production_feedback_received") {
          return {
            id: "quickQuote",
            label: "快速回传报价",
            hint: "先录入人工确认的报价总额，完整工艺与风险可在“报价与交期”中补充。",
            fields: '<input name="quote" aria-label="报价说明" placeholder="报价说明，例如 6.80 元/个" required><input name="total_amount" aria-label="订单总额" placeholder="订单总额，例如 2260.00" required><input name="currency" aria-label="币种" placeholder="币种" value="CNY" required>',
            button: "回传报价"
          };
        }
        if (["payment_confirmed", "production_ready", "production_in_progress"].includes(task.status)) {
          return {
            id: "quickPhoto",
            label: "快速回传生产现场",
            hint: "粘贴已上传的现场照片链接，系统会记录为“生产中”。",
            fields: '<input name="production_photos" aria-label="生产照片链接" placeholder="生产照片链接" required>',
            button: "回传照片"
          };
        }
        return null;
      }
      function nextAction(task) {
        const map = {
          production_request_created:["审核需求并提交报价","确认工艺、可行性、价格和交期后回传用户。","quote"],
          quote_requested:["补齐报价与交期","询问供应商并把真实反馈记录到任务。","quote"],
          production_feedback_received:["等待用户确认与付款","生产反馈已回传，此时不要提前生产。","quote"],
          payment_link_created:["等待付款确认","付款门槛未通过，生产操作仍被锁定。","production"],
          payment_confirmed:["确认已付款任务入场","核对订单后把任务更新为待生产。","production"],
          production_ready:["开始生产并留存现场记录","填写本批次生产进度和现场照片链接。","production"],
          production_in_progress:["更新进度或进入质检","记录异常、照片和当前完成情况。","production"],
          quality_check:["完成质检并安排发货","确认质量后填写承运商和物流单号。","logistics"],
          shipped:["跟踪签收并完成交付","收到交付凭证后标记任务完成。","logistics"],
          completed:["任务已完整交付","生产、物流和交付证据已回传。","history"]
        };
        return map[task.status] || ["检查任务需求","先核对中文需求单，再选择对应工作页填写结果。","requirement"];
      }
      function summary(task) {
        return '<div class="summary-strip">' +
          '<div class="summary-item"><span>数量</span><strong>' + esc(fmt(task.quantity)) + '</strong></div>' +
          '<div class="summary-item"><span>材质</span><strong>' + esc(zhSpec(task, "material")) + '</strong></div>' +
          '<div class="summary-item"><span>工艺</span><strong>' + esc(zhSpec(task, "process")) + '</strong></div>' +
          '<div class="summary-item"><span>目的地</span><strong>' + esc(zhSpec(task, "shipping_destination")) + '</strong></div></div>';
      }
      function feedbackRead(task) {
        const f = task.production_feedback;
        if (!f) return '<div class="empty-inline">还没有生产反馈。请在下方填写真实询价结果。</div>';
        return '<div class="kv">' + field("是否可做", f.feasible ? "可以生产" : "暂不可生产") + field("报价编号", f.quote_id) + field("报价说明", f.quote) + field("订单总价", f.total_amount ? f.total_amount + " " + (f.currency || "CNY") : null) + field("确认工艺", f.confirmed_process) + field("打样费", f.sample_cost) + field("生产周期", f.estimated_production_time) + field("物流周期", f.estimated_shipping_time) + field("风险", (f.risks || []).join("\\n"), true) + field("需要用户补充", (f.required_clarifications || []).join("\\n"), true) + '</div>';
      }
      function paymentRead(task) {
        const p = task.payment_intent;
        return '<div class="kv">' + field("支付模式", p?.provider === "mock" ? "模拟支付（不处理真实资金）" : "未创建") + field("付款状态", p?.status === "confirmed" ? "已确认" : p?.status === "link_created" ? "等待确认" : "未开始") + field("金额", p ? p.amount + " " + p.currency : null) + field("确认时间", date(p?.confirmed_at)) + '</div>';
      }
      function sampleRead(task) {
        const s = task.sample_result;
        if (!s) return '<div class="empty-inline">还没有样品结果</div>';
        return '<div class="kv">' + field("最终报价", s.quoted_price) + field("生产周期", s.production_time) + field("供应商反馈", s.supplier_feedback, true) + field("质量备注", s.quality_notes, true) + field("物流信息", s.shipping_info, true) + '</div>';
      }
      function fulfillmentRead(task) {
        const f = task.fulfillment || {};
        const latest = Array.isArray(f.production_updates) ? f.production_updates[f.production_updates.length - 1] : null;
        return '<div class="kv">' + field("最新生产阶段", latest ? statusNames[latest.stage] || latest.stage : null) + field("更新时间", date(latest?.updated_at)) + field("生产说明", latest?.message, true) + field("承运商", f.shipment?.carrier) + field("物流单号", f.shipment?.tracking_number) + field("预计送达", f.shipment?.estimated_delivery) + field("完成备注", f.completion?.completion_notes, true) + '</div>';
      }
      function historyRead(task) {
        const history = Array.isArray(task.history) ? task.history : [];
        return history.length ? '<div class="timeline">' + history.slice().reverse().map((item) =>
          '<div class="event"><b>' + esc(item.type || "任务更新") + '</b><p>' + esc(item.message || "已记录") + '</p><time>' + esc(date(item.createdAt || item.created_at)) + '</time></div>'
        ).join("") + '</div>' : '<div class="empty-inline">暂无历史记录</div>';
      }
      function formSection(title, hint, id, fields, button) {
        return '<section class="section"><div class="section-head"><h3>' + title + '</h3><span>' + hint + '</span></div><div class="section-body"><form id="' + id + '"><div class="form-grid">' + fields + '</div><div class="form-actions"><button class="primary" type="submit">' + button + '</button></div></form></div></section>';
      }
      function input(label, name, placeholder, full, type, hint) {
        const help = hint ? '<span class="field-hint">' + esc(hint) + '</span>' : "";
        if (type === "textarea") return '<label class="' + (full ? "full" : "") + '">' + label + '<textarea name="' + name + '" placeholder="' + esc(placeholder || "") + '"></textarea>' + help + '</label>';
        return '<label class="' + (full ? "full" : "") + '">' + label + '<input name="' + name + '" placeholder="' + esc(placeholder || "") + '" />' + help + '</label>';
      }
      function render(task) {
        const next = nextAction(task);
        const feedbackForm = formSection("提交生产反馈","内容会返回用户的 AI 界面","feedbackForm",
          '<label>是否可做<select name="feasible"><option value="true">可以做</option><option value="false">暂不可做</option></select></label>' +
          input("报价说明","quote","例如：单价 RMB 1.20/张，500 张起") + input("订单总价","total_amount","例如：600.00") +
          '<label>币种<select name="currency"><option value="CNY">CNY 人民币</option><option value="USD">USD 美元</option><option value="EUR">EUR 欧元</option><option value="GBP">GBP 英镑</option><option value="JPY">JPY 日元</option></select></label>' + input("打样费","sample_cost","例如：RMB 80") +
          input("生产周期","estimated_production_time","例如：样品确认后 5-7 天") + input("物流周期","estimated_shipping_time","例如：空运 5-8 天") +
          input("确认工艺","confirmed_process","例如：防水 PVC 彩印、吻切、哑膜",true) +
          input("需要用户补充","required_clarifications","一行一条",true,"textarea") + input("质量与交付风险","risks","一行一条",true,"textarea") +
          input("内部备注","operator_notes","仅生产端可见",true,"textarea"), "提交并回传用户");
        const sampleForm = formSection("保存样品结果","图片与视频仅接收链接","sampleForm",
          input("样品图片链接","sample_images","一行一个 URL",true,"textarea","手机拍照后先上传到企业网盘或图床，再把分享链接粘贴到这里；多张照片一行一个。") + input("样品视频链接","sample_videos","一行一个 URL",true,"textarea") +
          input("最终报价","quoted_price","") + input("预计生产时间","production_time","") +
          input("供应商反馈","supplier_feedback","",true,"textarea") + input("质量备注","quality_notes","",true,"textarea") + input("物流建议","shipping_info","",true,"textarea"), "保存样品记录");
        const productionForm = formSection("更新生产进度","付款确认后才能提交","productionForm",
          '<label>当前阶段<select name="stage"><option value="production_ready">待生产</option><option value="production_in_progress">生产中</option><option value="quality_check">质检中</option></select></label>' +
          input("进度说明","message","例如：首批已完成 60%") + input("生产照片链接","production_photos","一行一个 URL",true,"textarea","上传车间现场照片后粘贴链接；请勿填写本机文件路径。") + input("生产端备注","operator_notes","",true,"textarea"), "保存生产进度");
        const shipmentForm = formSection("提交发货信息","质检通过后填写","shipmentForm",
          input("承运商","carrier","") + input("物流单号","tracking_number","") + input("物流查询链接","tracking_url","https://",true) +
          input("发货时间","shipped_at","可留空使用当前时间") + input("预计送达","estimated_delivery","") + input("发货备注","shipping_notes","",true,"textarea"), "提交物流并回传");
        const completionForm = formSection("确认交付完成","请先核对签收或交付凭证","completionForm",
          input("交付时间","delivered_at","可留空使用当前时间") + input("交付凭证链接","proof_urls","一行一个 URL",true,"textarea","可填写签收照片、物流签收页面或客户确认记录的分享链接。") + input("完成备注","completion_notes","",true,"textarea"), "标记任务完成");
        document.getElementById("workspace").innerHTML =
          '<div class="detail-head"><div class="title-row"><div><h2>' + esc(displayName(task)) + '</h2><div class="task-id">' + esc(task.task_id) + '</div></div><select class="status-select" id="statusSelect" aria-label="任务状态">' + statusOptions(task) + '</select></div>' +
          '<nav class="tabs"><button class="tab" data-tab="requirement">需求单</button><button class="tab" data-tab="quote">报价与交期</button><button class="tab" data-tab="sample">样品</button><button class="tab" data-tab="production">生产与质检</button><button class="tab" data-tab="logistics">物流交付</button><button class="tab" data-tab="history">完整记录</button></nav></div>' +
          '<div class="detail-body"><div class="next-action"><div><b>下一步：' + esc(next[0]) + '</b><p>' + esc(next[1]) + '</p></div><button class="primary" id="nextButton" type="button">前往处理</button></div>' + quickBar(task) + summary(task) +
          '<div class="panel" data-panel="requirement"><section class="section"><div class="section-head"><h3>中文生产需求单</h3><span>由 AI 需求结构化生成</span></div><div class="section-body"><pre class="production-sheet">' + esc(productionText(task)) + '</pre></div></section><section class="section"><div class="section-head"><h3>关键规格</h3><span>核对缺失项再询价</span></div><div class="section-body"><div class="kv">' + field("产品名称", displayName(task)) + field("产品类别", categoryNames[task.category] || task.category) + field("数量", task.quantity) + field("材质", zhSpec(task, "material")) + field("尺寸", zhSpec(task, "dimensions")) + field("工艺", zhSpec(task, "process")) + field("颜色要求", zhSpec(task, "color_requirements"), true) + field("包装要求", zhSpec(task, "packaging_requirements"), true) + field("图稿要求", zhSpec(task, "artwork_requirements"), true) + field("中文需求说明", task.order_draft?.production_description_zh || "待 AI 客户端提供中文译文", true) + '</div></div></section></div>' +
          '<div class="panel" data-panel="quote"><section class="section"><div class="section-head"><h3>已回传的生产结论</h3><span>价格必须来自人工</span></div><div class="section-body">' + feedbackRead(task) + '</div></section>' + feedbackForm + '</div>' +
          '<div class="panel" data-panel="sample"><section class="section"><div class="section-head"><h3>最新样品结果</h3><span>质量证据</span></div><div class="section-body">' + sampleRead(task) + '</div></section>' + sampleForm + '</div>' +
          '<div class="panel" data-panel="production"><section class="section"><div class="section-head"><h3>付款与生产门槛</h3><span>未确认付款不能生产</span></div><div class="section-body">' + paymentRead(task) + '</div></section><section class="section"><div class="section-head"><h3>当前执行记录</h3><span>生产与质检</span></div><div class="section-body">' + fulfillmentRead(task) + '</div></section>' + productionForm + '</div>' +
          '<div class="panel" data-panel="logistics"><section class="section"><div class="section-head"><h3>物流与交付状态</h3><span>回传用户 AI 界面</span></div><div class="section-body">' + fulfillmentRead(task) + '</div></section>' + shipmentForm + completionForm + '</div>' +
          '<div class="panel" data-panel="history"><section class="section"><div class="section-head"><h3>任务时间线</h3><span>全程可追溯</span></div><div class="section-body">' + historyRead(task) + '</div></section><details><summary>查看完整结构化数据（调试）</summary><pre class="raw">' + esc(JSON.stringify(task, null, 2)) + '</pre></details></div></div>';
        bindDetail(task, next[2]);
      }
      function showTab(name) {
        activeTab = name;
        document.querySelectorAll(".tab").forEach((node) => node.classList.toggle("active", node.dataset.tab === name));
        document.querySelectorAll(".panel").forEach((node) => node.classList.toggle("active", node.dataset.panel === name));
      }
      function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
      function lines(value) { return String(value || "").split(/\\r?\\n|,/).map((x) => x.trim()).filter(Boolean); }
      async function submitForm(event, path, body, success) {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button[type=submit]");
        const old = button.textContent; button.disabled = true; button.textContent = "正在保存…";
        try { await api(path, { method:"POST", body:JSON.stringify(body(formData(event.currentTarget))) }); notify(success); await selectTask(selectedTaskId, true); }
        catch (error) { notify(error.message, true); button.disabled = false; button.textContent = old; }
      }
      function bindDetail(task, nextTab) {
        document.querySelectorAll(".tab").forEach((node) => node.addEventListener("click", () => showTab(node.dataset.tab)));
        document.getElementById("nextButton").addEventListener("click", () => showTab(nextTab));
        document.getElementById("statusSelect").addEventListener("change", async (event) => {
          try { await api("/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/status", { method:"POST", body:JSON.stringify({ status:event.target.value }) }); notify("任务状态已更新"); await selectTask(selectedTaskId, true); }
          catch (error) { notify(error.message, true); }
        });
        document.getElementById("feedbackForm").addEventListener("submit", (e) => submitForm(e, "/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/production-feedback", (d) => ({ feasible:d.feasible === "true", confirmed_process:d.confirmed_process || undefined, quote:d.quote || undefined, total_amount:d.total_amount || undefined, currency:d.currency || undefined, sample_cost:d.sample_cost || undefined, estimated_production_time:d.estimated_production_time || undefined, estimated_shipping_time:d.estimated_shipping_time || undefined, required_clarifications:lines(d.required_clarifications), risks:lines(d.risks), operator_notes:d.operator_notes || undefined }), "生产反馈已回传"));
        document.getElementById("sampleForm").addEventListener("submit", (e) => submitForm(e, "/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/sample-result", (d) => ({ sample_images:lines(d.sample_images), sample_videos:lines(d.sample_videos), quoted_price:d.quoted_price || undefined, production_time:d.production_time || undefined, supplier_feedback:d.supplier_feedback || undefined, quality_notes:d.quality_notes || undefined, shipping_info:d.shipping_info || undefined }), "样品结果已保存"));
        document.getElementById("productionForm").addEventListener("submit", (e) => submitForm(e, "/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/production-status", (d) => ({ stage:d.stage, message:d.message || undefined, production_photos:lines(d.production_photos), operator_notes:d.operator_notes || undefined }), "生产进度已保存"));
        document.getElementById("shipmentForm").addEventListener("submit", (e) => submitForm(e, "/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/shipment", (d) => ({ carrier:d.carrier || undefined, tracking_number:d.tracking_number || undefined, tracking_url:d.tracking_url || undefined, shipped_at:d.shipped_at || undefined, estimated_delivery:d.estimated_delivery || undefined, shipping_notes:d.shipping_notes || undefined }), "物流信息已回传"));
        document.getElementById("completionForm").addEventListener("submit", (e) => submitForm(e, "/operator/api/tasks/" + encodeURIComponent(selectedTaskId) + "/complete", (d) => ({ delivered_at:d.delivered_at || undefined, completion_notes:d.completion_notes || undefined, proof_urls:lines(d.proof_urls) }), "任务已完成"));
        const taskPath = "/operator/api/tasks/" + encodeURIComponent(selectedTaskId);
        const quickQuote = document.getElementById("quickQuote");
        if (quickQuote) quickQuote.addEventListener("submit", (e) => submitForm(e, taskPath + "/production-feedback", (d) => ({ feasible:true, quote:d.quote, total_amount:d.total_amount, currency:d.currency || "CNY" }), "报价已回传，用户确认后才能发起付款"));
        const quickPhoto = document.getElementById("quickPhoto");
        if (quickPhoto) quickPhoto.addEventListener("submit", (e) => submitForm(e, taskPath + "/production-status", (d) => ({ stage:"production_in_progress", production_photos:lines(d.production_photos) }), "生产现场已回传用户"));
        showTab(activeTab);
      }
      async function selectTask(id, keepTab) {
        selectedTaskId = id; if (!keepTab) activeTab = "requirement"; renderTasks();
        document.getElementById("workspace").innerHTML = '<div class="empty"><div>正在打开任务…</div></div>';
        try { const task = await api("/operator/api/tasks/" + encodeURIComponent(id)); render(task); }
        catch (error) { notify(error.message, true); }
      }
      document.querySelectorAll(".filter").forEach((node) => node.addEventListener("click", () => {
        activeFilter = node.dataset.filter; selectedTaskId = null;
        document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("active", x === node));
        renderTasks();
        const first = tasks.find((task) => group(task.status) === activeFilter); if (first) selectTask(first.task_id);
      }));
      document.getElementById("search").addEventListener("input", renderTasks);
      document.getElementById("logout").addEventListener("click", async () => { await fetch("/operator/logout", { method:"POST", headers:{"content-type":"application/json"}, body:"{}" }); window.location.replace("/operator/login"); });
      window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason && event.reason.message ? event.reason.message : String(event.reason);
        notify("操作失败：" + reason, true);
      });
      loadTasks().catch((error) => { document.getElementById("taskList").innerHTML = '<div class="empty-inline">' + esc(error.message) + '</div>'; });
    </script>
  </body>
</html>`;
}
