export function userWorkspaceHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI · Reality Supply Chain</title>
    <style>
      :root {
        --bg: #f4f6f8;
        --surface: #ffffff;
        --surface-soft: #f8fafb;
        --ink: #17201f;
        --muted: #65706e;
        --line: #dce3e1;
        --brand: #087c69;
        --brand-dark: #065f52;
        --brand-soft: #e7f5f1;
        --blue: #2563eb;
        --amber: #b54708;
        --amber-soft: #fff5e8;
        --success: #067647;
        --danger: #b42318;
        --shadow: 0 12px 32px rgba(22, 38, 35, 0.08);
      }
      * { box-sizing: border-box; }
      html { min-width: 320px; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      button, textarea { font: inherit; }
      button:focus-visible, textarea:focus-visible, a:focus-visible {
        outline: 3px solid rgba(8, 124, 105, 0.24);
        outline-offset: 2px;
      }
      .topbar {
        height: 64px;
        padding: 0 clamp(16px, 4vw, 44px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        background: #13201e;
        color: #fff;
        border-bottom: 1px solid #263936;
      }
      .brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
      .mark {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border: 1px solid #4f756e;
        border-radius: 7px;
        color: #8fe0cf;
        font-weight: 900;
      }
      .brand strong { display: block; font-size: 15px; }
      .brand span { display: block; color: #9eb1ad; font-size: 11px; margin-top: 2px; }
      .top-actions { display: flex; align-items: center; gap: 14px; }
      .live {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #b7c7c4;
        font-size: 12px;
      }
      .live::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 4px rgba(74, 222, 128, .12);
      }
      .topbar a { color: #d9e3e1; text-decoration: none; font-size: 13px; font-weight: 700; }
      .journey {
        min-height: 58px;
        padding: 0 clamp(16px, 4vw, 44px);
        background: var(--surface);
        border-bottom: 1px solid var(--line);
        display: grid;
        grid-template-columns: repeat(5, minmax(100px, 1fr));
        overflow-x: auto;
      }
      .journey-step {
        position: relative;
        min-width: 100px;
        padding: 13px 8px 10px 32px;
        color: var(--muted);
        font-size: 11px;
        white-space: nowrap;
      }
      .journey-step b { display: block; color: var(--ink); font-size: 12px; margin-bottom: 2px; }
      .journey-step::before {
        content: attr(data-number);
        position: absolute;
        left: 4px;
        top: 15px;
        width: 20px;
        height: 20px;
        display: grid;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: #fff;
        font-size: 10px;
        font-weight: 800;
      }
      .journey-step::after {
        content: "";
        position: absolute;
        left: 15px;
        right: -4px;
        bottom: 0;
        height: 2px;
        background: transparent;
      }
      .journey-step.done::before { content: "✓"; background: var(--brand); border-color: var(--brand); color: #fff; }
      .journey-step.active::before { border-color: var(--brand); color: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
      .journey-step.done::after, .journey-step.active::after { background: var(--brand); }
      .shell {
        width: min(1480px, 100%);
        margin: 0 auto;
        padding: 22px clamp(14px, 3vw, 30px) 38px;
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(330px, .65fr);
        gap: 18px;
        align-items: start;
      }
      .conversation, .task-panel {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: var(--shadow);
      }
      .panel-head {
        min-height: 58px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--line);
      }
      .panel-head h1, .panel-head h2 { margin: 0; font-size: 15px; }
      .panel-head p { margin: 3px 0 0; color: var(--muted); font-size: 12px; }
      .agent { display: flex; align-items: center; gap: 10px; }
      .agent-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 7px;
        background: var(--brand-soft);
        color: var(--brand-dark);
        font-weight: 900;
      }
      .mode {
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
      }
      .feed {
        min-height: 470px;
        max-height: calc(100vh - 252px);
        overflow: auto;
        padding: 18px;
        background: #fbfcfc;
      }
      .message { display: flex; gap: 10px; margin: 0 0 18px; align-items: flex-start; }
      .message.user { flex-direction: row-reverse; }
      .avatar {
        flex: 0 0 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #e8eceb;
        color: #46514f;
        font-size: 10px;
        font-weight: 900;
      }
      .message.ai .avatar { background: var(--brand); color: #fff; }
      .bubble {
        max-width: 80%;
        padding: 11px 13px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        line-height: 1.55;
        font-size: 14px;
        white-space: pre-wrap;
      }
      .message.user .bubble { background: #edf4ff; border-color: #cfdef7; }
      .system-event {
        margin: 0 38px 18px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-left: 3px solid var(--brand);
        background: var(--brand-soft);
        color: #315650;
        font-size: 12px;
      }
      .composer {
        padding: 13px;
        border-top: 1px solid var(--line);
        background: #fff;
      }
      .composer textarea {
        width: 100%;
        min-height: 86px;
        max-height: 180px;
        resize: vertical;
        border: 1px solid #cbd5d2;
        border-radius: 7px;
        padding: 11px 12px;
        color: var(--ink);
        background: #fff;
        line-height: 1.5;
      }
      .composer-foot {
        margin-top: 9px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .hint { color: var(--muted); font-size: 11px; }
      button {
        min-height: 38px;
        padding: 8px 13px;
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
      .task-panel { position: sticky; top: 18px; overflow: hidden; }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--brand-soft);
        color: var(--brand-dark);
        font-size: 11px;
        font-weight: 800;
      }
      .task-body { padding: 16px; }
      .empty-task {
        min-height: 430px;
        display: grid;
        place-items: center;
        text-align: center;
        color: var(--muted);
      }
      .empty-symbol {
        width: 52px;
        height: 52px;
        margin: 0 auto 13px;
        display: grid;
        place-items: center;
        border: 1px dashed #aebbb8;
        border-radius: 8px;
        color: var(--brand);
        font-weight: 900;
      }
      .task-title { margin: 0 0 5px; font-size: 20px; }
      .task-id { color: var(--muted); font: 11px ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap: anywhere; }
      .spec-grid {
        margin: 16px 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-top: 1px solid var(--line);
        border-left: 1px solid var(--line);
      }
      .spec {
        min-width: 0;
        padding: 10px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }
      .spec span { display: block; color: var(--muted); font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
      .spec strong { display: block; font-size: 13px; overflow-wrap: anywhere; }
      .gate {
        padding: 12px;
        border: 1px solid #f0d5b5;
        border-radius: 7px;
        background: var(--amber-soft);
      }
      .gate strong { display: block; color: #7a2e0e; font-size: 13px; }
      .gate p { margin: 5px 0 0; color: #8a4a22; font-size: 12px; line-height: 1.5; }
      .checks { margin: 16px 0; }
      .check {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 34px;
        border-bottom: 1px solid #edf0ef;
        color: var(--muted);
        font-size: 12px;
      }
      .check::before {
        content: "";
        width: 16px; height: 16px;
        border: 1px solid #b8c3c1;
        border-radius: 50%;
      }
      .check.done { color: var(--ink); }
      .check.done::before { content: "✓"; display: grid; place-items: center; background: var(--brand); border-color: var(--brand); color: #fff; font-size: 10px; }
      .action-stack { display: grid; gap: 8px; }
      .action-stack button { width: 100%; }
      .secondary-note { text-align: center; color: var(--muted); font-size: 10px; line-height: 1.45; }
      .quote {
        margin: 12px 0;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: var(--surface-soft);
      }
      .quote .price { margin: 4px 0; font-size: 19px; font-weight: 900; }
      .quote small { color: var(--muted); }
      .toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 10;
        max-width: 360px;
        padding: 11px 14px;
        border-radius: 7px;
        background: #17201f;
        color: #fff;
        box-shadow: var(--shadow);
        font-size: 13px;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: .2s ease;
      }
      .toast.show { transform: translateY(0); opacity: 1; }
      .toast.error { background: var(--danger); }
      @media (max-width: 940px) {
        .shell { grid-template-columns: 1fr; }
        .task-panel { position: static; }
        .feed { max-height: none; min-height: 400px; }
        .empty-task { min-height: 230px; }
      }
      @media (max-width: 560px) {
        .topbar { height: 58px; }
        .top-actions { display: none; }
        .journey {
          grid-template-columns: repeat(5, 142px);
          padding: 0 10px;
          scroll-snap-type: x proximity;
          overscroll-behavior-inline: contain;
        }
        .journey-step {
          min-width: 142px;
          scroll-snap-align: start;
        }
        .shell { padding: 12px 10px 28px; gap: 12px; }
        .feed { padding: 13px; }
        .bubble { max-width: 88%; }
        .system-event { margin-left: 0; margin-right: 0; }
        .composer-foot { align-items: stretch; flex-direction: column; }
        .composer-foot button { width: 100%; }
        .hint { max-width: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <div class="brand"><div class="mark">M</div><div><strong>MadeForAI</strong><span>Reality Supply Chain</span></div></div>
      <div class="top-actions"><span class="live">Human operator network online</span><a href="/operator">Operator workspace</a></div>
    </header>
    <nav class="journey" aria-label="Task progress">
      <div class="journey-step active" data-stage="1" data-number="1"><b>Brief</b>Make it producible</div>
      <div class="journey-step" data-stage="2" data-number="2"><b>Order draft</b>User approval</div>
      <div class="journey-step" data-stage="3" data-number="3"><b>Reality review</b>Quote and risks</div>
      <div class="journey-step" data-stage="4" data-number="4"><b>Production</b>Payment gated</div>
      <div class="journey-step" data-stage="5" data-number="5"><b>Delivery</b>Proof returned</div>
    </nav>
    <main class="shell">
      <section class="conversation">
        <div class="panel-head">
          <div class="agent"><div class="agent-icon">AI</div><div><h1>Manufacturing agent</h1><p>Connected to a human Reality Operator</p></div></div>
          <span class="mode">Guided run</span>
        </div>
        <div class="feed" id="feed">
          <div class="message ai"><div class="avatar">AI</div><div class="bubble">Tell me what you want to make. I will turn your idea into a production brief, identify missing specifications, and route the confirmed task to a human operator in China.</div></div>
        </div>
        <div class="composer">
          <textarea id="requestText" aria-label="Manufacturing request">I want to make 500 waterproof vinyl sticker packs for a global merch drop. Each pack has 10 kiss-cut stickers with matte lamination. Ship to Los Angeles.</textarea>
          <div class="composer-foot">
            <span class="hint">No order is placed until you approve the production draft.</span>
            <button class="primary" id="startButton" type="button">Create production brief</button>
          </div>
        </div>
      </section>
      <aside class="task-panel">
        <div class="panel-head"><div><h2>Reality task</h2><p id="taskSubtitle">No task created</p></div><span class="status-pill" id="statusPill">Draft</span></div>
        <div class="task-body" id="taskBody">
          <div class="empty-task"><div><div class="empty-symbol">MFG</div><strong>Your production record will appear here</strong><p>Specifications, human decisions, payment gate, and delivery proof stay in one traceable task.</p></div></div>
        </div>
      </aside>
    </main>
    <div class="toast" id="toast" role="status"></div>
    <script>
      let state = { stage: 1, taskId: null, draft: null, feedback: null, busy: false };
      const feed = document.getElementById("feed");
      const taskBody = document.getElementById("taskBody");
      function esc(value) {
        return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
      }
      function api(path, body) {
        return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) })
          .then(async (response) => {
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "The request could not be completed.");
            return payload;
          });
      }
      function notify(message, error) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = "toast show" + (error ? " error" : "");
        window.setTimeout(() => { toast.className = "toast"; }, 2600);
      }
      function message(kind, text) {
        const node = document.createElement("div");
        node.className = "message " + kind;
        node.innerHTML = '<div class="avatar">' + (kind === "ai" ? "AI" : "YOU") + '</div><div class="bubble">' + esc(text) + '</div>';
        feed.appendChild(node);
        feed.scrollTop = feed.scrollHeight;
      }
      function eventLine(text) {
        const node = document.createElement("div");
        node.className = "system-event";
        node.textContent = text;
        feed.appendChild(node);
        feed.scrollTop = feed.scrollHeight;
      }
      function setStage(stage) {
        state.stage = stage;
        document.querySelectorAll(".journey-step").forEach((node) => {
          const value = Number(node.dataset.stage);
          node.classList.toggle("done", value < stage);
          node.classList.toggle("active", value === stage);
        });
      }
      function spec(label, value) {
        return '<div class="spec"><span>' + esc(label) + '</span><strong>' + esc(value || "To confirm") + '</strong></div>';
      }
      function checks(done) {
        const items = ["Production-ready specifications", "Human feasibility and quote", "User payment approval", "Production and quality evidence", "Shipment and delivery proof"];
        return '<div class="checks">' + items.map((item, index) => '<div class="check' + (index < done ? " done" : "") + '">' + esc(item) + '</div>').join("") + '</div>';
      }
      function setTaskHeader(status) {
        document.getElementById("taskSubtitle").textContent = state.taskId ? "ID " + state.taskId : "No task created";
        document.getElementById("statusPill").textContent = status;
      }
      function renderDraft() {
        const d = state.draft;
        setTaskHeader("Awaiting approval");
        taskBody.innerHTML = '<h3 class="task-title">' + esc(d.product_name) + '</h3><div class="task-id">' + esc(state.taskId) + '</div>' +
          '<div class="spec-grid">' + spec("Quantity", d.quantity) + spec("Material", d.material) + spec("Dimensions", d.dimensions) + spec("Process", d.process) + spec("Packaging", d.packaging_requirements) + spec("Ship to", d.shipping_destination) + '</div>' +
          '<div class="gate"><strong>User approval gate</strong><p>Review the production record. Nothing is sent to production until you confirm it.</p></div>' +
          checks(1) + '<div class="action-stack"><button class="primary" id="confirmButton" type="button">Confirm and send to operator</button><button type="button" id="reviseButton">Request a revision</button></div>';
        document.getElementById("confirmButton").addEventListener("click", confirmTask);
        document.getElementById("reviseButton").addEventListener("click", () => notify("Revision stays with the AI until you approve it."));
      }
      function renderFeedback() {
        const f = state.feedback;
        setTaskHeader("Human quote received");
        taskBody.innerHTML = '<h3 class="task-title">' + esc(state.draft.product_name) + '</h3><div class="task-id">' + esc(state.taskId) + '</div>' +
          '<div class="quote"><small>Human-confirmed production quote · ' + esc(f.quote_id) + '</small><div class="price">' + esc(f.total_amount ? f.total_amount + " " + (f.currency || "CNY") : f.quote) + '</div><small>' + esc(f.quote) + ' · Sample: ' + esc(f.sample_cost) + '</small></div>' +
          '<div class="spec-grid">' + spec("Process", f.confirmed_process) + spec("Production", f.estimated_production_time) + spec("Shipping", f.estimated_shipping_time) + spec("Feasibility", f.feasible ? "Confirmed" : "Needs revision") + '</div>' +
          '<div class="gate"><strong>Payment gate</strong><p>This competition build uses a mock payment confirmation. It never collects or processes card details.</p></div>' +
          checks(2) + '<div class="action-stack"><button class="primary" id="payButton" type="button">Approve quote and confirm mock payment</button><button type="button" id="questionButton">Ask about risks</button></div>';
        document.getElementById("payButton").addEventListener("click", payTask);
        document.getElementById("questionButton").addEventListener("click", () => message("ai", "The operator flagged two checks: proof the fine cut lines before mass production, and verify the waterproof vinyl stock. Both are recorded in the task."));
      }
      function renderProduction(data) {
        setTaskHeader("In production");
        taskBody.innerHTML = '<h3 class="task-title">' + esc(state.draft.product_name) + '</h3><div class="task-id">' + esc(state.taskId) + '</div>' +
          '<div class="spec-grid">' + spec("Payment", "Mock confirmed") + spec("Production", "In progress") + spec("Quality gate", "Scheduled") + spec("Operator", "Reality Operator · China") + '</div>' +
          '<div class="gate"><strong>Production is unlocked</strong><p>The workflow only permits production updates after payment confirmation.</p></div>' +
          checks(3) + '<div class="action-stack"><button class="primary" id="deliveryButton" type="button">Advance to verified delivery</button></div>';
        document.getElementById("deliveryButton").addEventListener("click", finishTask);
      }
      function renderComplete(data) {
        setTaskHeader("Completed");
        taskBody.innerHTML = '<h3 class="task-title">' + esc(state.draft.product_name) + '</h3><div class="task-id">' + esc(state.taskId) + '</div>' +
          '<div class="spec-grid">' + spec("Final state", "Delivered") + spec("Carrier", data.shipment.carrier) + spec("Tracking", data.shipment.tracking_number) + spec("Delivery proof", "Recorded") + '</div>' +
          '<div class="gate" style="background:var(--brand-soft);border-color:#b7ded5"><strong style="color:var(--brand-dark)">Reality loop completed</strong><p style="color:#315650">The AI can now return structured production, shipment, and delivery evidence to the user.</p></div>' +
          checks(5) + '<div class="action-stack"><button id="newButton" type="button">Start another task</button></div>';
        document.getElementById("newButton").addEventListener("click", () => window.location.reload());
      }
      async function runBusy(button, label, action) {
        if (state.busy) return;
        state.busy = true;
        const original = button.textContent;
        button.disabled = true;
        button.textContent = label;
        try { await action(); } catch (error) { notify(error.message, true); button.disabled = false; button.textContent = original; }
        finally { state.busy = false; }
      }
      async function startTask() {
        const button = document.getElementById("startButton");
        const request = document.getElementById("requestText").value.trim();
        if (request.length < 20) return notify("Please describe the product, quantity, and destination.", true);
        await runBusy(button, "Structuring task…", async () => {
          message("user", request);
          const data = await api("/user/api/start", { request });
          state.taskId = data.task_id;
          state.draft = data.order_draft;
          message("ai", data.artwork_message);
          eventLine("Production record created · Human approval required");
          message("ai", "I created a structured order draft. Please check the manufacturing details before I send anything to the Reality Operator.");
          setStage(2);
          renderDraft();
          document.getElementById("requestText").disabled = true;
          button.style.display = "none";
        });
      }
      async function confirmTask(event) {
        await runBusy(event.currentTarget, "Sending to operator…", async () => {
          const data = await api("/user/api/tasks/" + encodeURIComponent(state.taskId) + "/confirm");
          state.feedback = data.production_feedback;
          eventLine("User approved · Chinese production request sent");
          message("ai", "A human Reality Operator reviewed feasibility, process, timing, and risk. The response below is structured for your approval.");
          setStage(3);
          renderFeedback();
        });
      }
      async function payTask(event) {
        await runBusy(event.currentTarget, "Confirming mock payment…", async () => {
          const data = await api("/user/api/tasks/" + encodeURIComponent(state.taskId) + "/pay", {
            accepted_quote_id: state.feedback.quote_id
          });
          eventLine("Mock payment confirmed · Production gate unlocked");
          message("ai", "Payment confirmation is recorded. This is a mock transaction for workflow validation; no money or card data was processed. The operator can now begin production.");
          setStage(4);
          renderProduction(data);
        });
      }
      async function finishTask(event) {
        await runBusy(event.currentTarget, "Recording delivery…", async () => {
          const data = await api("/user/api/tasks/" + encodeURIComponent(state.taskId) + "/fulfill");
          eventLine("Quality check passed · Shipment and delivery proof returned");
          message("ai", "Your Reality task is complete. Production status, tracking, and delivery evidence are now available as structured data in this conversation.");
          setStage(5);
          renderComplete(data);
        });
      }
      document.getElementById("startButton").addEventListener("click", startTask);
    </script>
  </body>
</html>`;
}
