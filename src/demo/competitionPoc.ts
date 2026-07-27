export function competitionPocHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MadeForAI | 60 秒赛事 POC</title>
    <style>
      :root {
        --bg: #0d1715;
        --surface: #f7f9f8;
        --surface-strong: #ffffff;
        --ink: #16201e;
        --muted: #66736f;
        --line: #dce3e0;
        --brand: #087c69;
        --brand-dark: #05594c;
        --brand-soft: #e5f4ef;
        --amber: #b54708;
        --amber-soft: #fff4e5;
        --blue: #2563eb;
        --success: #15803d;
        --danger: #b42318;
        --shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
      }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; }
      body {
        margin: 0;
        overflow: hidden;
        color: #fff;
        background:
          linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px),
          var(--bg);
        background-size: 42px 42px;
        font-family: Inter, "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
      }
      button { font: inherit; }
      .app {
        width: 100%;
        height: 100%;
        min-width: 960px;
        min-height: 540px;
        display: grid;
        grid-template-rows: 74px 1fr 40px;
      }
      .topbar {
        padding: 0 clamp(32px, 4vw, 72px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,.1);
        background: rgba(13, 23, 21, .92);
        backdrop-filter: blur(14px);
      }
      .brand { display: flex; align-items: center; gap: 14px; }
      .mark {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border: 1px solid #4d736b;
        border-radius: 7px;
        color: #92dfcf;
        font-weight: 900;
      }
      .brand strong { display: block; font-size: 16px; }
      .brand span { display: block; color: #91a6a1; font-size: 11px; margin-top: 2px; }
      .meta { display: flex; align-items: center; gap: 22px; }
      .live {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #aebfbb;
        font-size: 12px;
        font-weight: 700;
      }
      .live::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 5px rgba(74,222,128,.12);
      }
      .clock {
        min-width: 58px;
        color: #c7d3d0;
        font-size: 14px;
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .replay {
        width: 38px;
        height: 38px;
        padding: 0;
        display: grid;
        place-items: center;
        border: 1px solid #3a504b;
        border-radius: 7px;
        background: transparent;
        color: #dbe6e3;
        cursor: pointer;
      }
      .replay:hover { background: rgba(255,255,255,.06); }
      .stage { position: relative; overflow: hidden; }
      .scene {
        position: absolute;
        inset: 0;
        padding: clamp(34px, 5vh, 68px) clamp(44px, 6vw, 104px);
        display: grid;
        grid-template-columns: minmax(300px, .78fr) minmax(620px, 1.42fr);
        gap: clamp(32px, 5vw, 88px);
        align-items: center;
        opacity: 0;
        transform: translateY(18px);
        pointer-events: none;
        transition: opacity .55s ease, transform .55s ease;
      }
      .scene.active { opacity: 1; transform: none; pointer-events: auto; }
      .scene.hook, .scene.close {
        grid-template-columns: 1fr;
        text-align: center;
        place-items: center;
      }
      .copy { max-width: 580px; }
      .eyebrow {
        margin: 0 0 18px;
        color: #8ddac9;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      h1, h2 { margin: 0; letter-spacing: 0; }
      h1 {
        max-width: 1120px;
        font-size: clamp(50px, 6vw, 96px);
        line-height: 1.04;
      }
      h2 {
        font-size: clamp(38px, 4vw, 64px);
        line-height: 1.1;
      }
      .copy p {
        margin: 24px 0 0;
        max-width: 520px;
        color: #b5c3bf;
        font-size: clamp(17px, 1.45vw, 24px);
        line-height: 1.55;
      }
      .hook .sub, .close .sub {
        margin: 28px 0 0;
        color: #aabbb6;
        font-size: clamp(18px, 1.7vw, 28px);
      }
      .accent { color: #87ddc9; }
      .product {
        position: relative;
        min-height: min(680px, calc(100vh - 178px));
        overflow: hidden;
        color: var(--ink);
        background: var(--surface);
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 8px;
        box-shadow: var(--shadow);
      }
      .windowbar {
        height: 54px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: #13201e;
        color: #fff;
      }
      .windowbrand { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; }
      .windowbrand i {
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        border: 1px solid #496d65;
        border-radius: 5px;
        color: #8fd8c8;
        font-style: normal;
      }
      .windowmeta { color: #a9bbb7; font-size: 11px; }
      .workflow {
        height: 52px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        background: var(--surface-strong);
        border-bottom: 1px solid var(--line);
      }
      .workflow span {
        padding: 11px 8px 9px;
        color: var(--muted);
        font-size: 10px;
        text-align: center;
        border-bottom: 3px solid transparent;
      }
      .workflow span b { display: block; color: var(--ink); font-size: 11px; margin-bottom: 2px; }
      .workflow span.on { color: var(--brand); border-color: var(--brand); }
      .windowbody { height: calc(100% - 106px); padding: 20px; overflow: hidden; }
      .split { height: 100%; display: grid; grid-template-columns: 1.28fr .72fr; gap: 16px; }
      .panel {
        min-width: 0;
        background: var(--surface-strong);
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .panelhead {
        min-height: 56px;
        padding: 11px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid var(--line);
      }
      .panelhead strong { display: block; font-size: 13px; }
      .panelhead small { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; }
      .agent { display: flex; align-items: center; gap: 9px; }
      .avatar {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 6px;
        background: var(--brand-soft);
        color: var(--brand-dark);
        font-size: 11px;
        font-weight: 900;
      }
      .status {
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--brand-soft);
        color: var(--brand-dark);
        font-size: 10px;
        font-weight: 800;
      }
      .feed { padding: 16px; display: grid; gap: 12px; }
      .message {
        max-width: 88%;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: #fbfcfc;
        font-size: 13px;
        line-height: 1.52;
      }
      .message.user { margin-left: auto; color: #fff; background: var(--brand); border-color: var(--brand); }
      .tool {
        padding: 12px 14px;
        border: 1px solid #b8dcd3;
        border-radius: 7px;
        background: #f2faf7;
      }
      .tooltop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .tool code { color: var(--brand-dark); font-size: 11px; font-weight: 800; }
      .tool p { margin: 9px 0 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
      .check { color: var(--success); font-weight: 900; }
      .taskempty {
        height: calc(100% - 56px);
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .taskid { color: var(--muted); font-family: ui-monospace, Consolas, monospace; font-size: 9px; }
      .specgrid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1px;
        background: var(--line);
        border-bottom: 1px solid var(--line);
      }
      .spec {
        min-height: 72px;
        padding: 13px 14px;
        background: #fff;
      }
      .spec small { display: block; color: var(--muted); font-size: 9px; }
      .spec strong { display: block; margin-top: 6px; font-size: 12px; line-height: 1.35; }
      .approval {
        margin: 16px;
        padding: 13px 14px;
        border-left: 4px solid var(--amber);
        background: var(--amber-soft);
      }
      .approval b { display: block; color: #7a2e0e; font-size: 12px; }
      .approval p { margin: 5px 0 0; color: #985016; font-size: 10px; line-height: 1.45; }
      .buttonrow { padding: 0 16px 16px; display: flex; gap: 8px; }
      .button {
        min-height: 34px;
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        font-size: 10px;
        font-weight: 800;
      }
      .button.primary { color: #fff; background: var(--brand); border-color: var(--brand); }
      .operator-layout { height: 100%; display: grid; grid-template-columns: 210px 1fr; }
      .queue { background: #fff; border-right: 1px solid var(--line); }
      .queue h3 { margin: 0; padding: 18px 16px 12px; font-size: 15px; }
      .search {
        margin: 0 12px 12px;
        padding: 10px 11px;
        border: 1px solid var(--line);
        border-radius: 6px;
        color: var(--muted);
        font-size: 10px;
      }
      .queueitem {
        margin: 8px;
        padding: 12px;
        border-left: 3px solid var(--brand);
        background: var(--brand-soft);
      }
      .queueitem strong { display: block; font-size: 11px; }
      .queueitem span { display: block; margin-top: 5px; color: var(--muted); font-size: 9px; }
      .workspace { padding: 18px 20px; overflow: hidden; }
      .workspace-title { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .workspace-title h3 { margin: 0; font-size: 20px; }
      .workspace-title p { margin: 5px 0 0; color: var(--muted); font-size: 9px; }
      .tabs { display: flex; gap: 24px; margin: 18px 0 14px; border-bottom: 1px solid var(--line); }
      .tabs span { padding: 0 0 10px; color: var(--muted); font-size: 11px; font-weight: 800; }
      .tabs span.on { color: var(--brand-dark); border-bottom: 2px solid var(--brand); }
      .sheet {
        padding: 15px 16px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: #fff;
      }
      .sheethead { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .sheethead strong { font-size: 13px; }
      .sheethead small { color: var(--muted); font-size: 9px; }
      .production-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        background: var(--line);
        border: 1px solid var(--line);
      }
      .production-grid .spec { min-height: 66px; }
      .brief {
        margin-top: 12px;
        padding: 13px 14px;
        border-left: 4px solid var(--brand);
        background: #f8fbfa;
        font-size: 10px;
        line-height: 1.65;
      }
      .quote-layout { height: 100%; display: grid; grid-template-columns: 1.08fr .92fr; gap: 16px; }
      .metric {
        padding: 18px;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .metric small { display: block; color: var(--muted); font-size: 10px; }
      .amount { margin: 8px 0 2px; font-size: 34px; font-weight: 900; }
      .amount span { font-size: 15px; color: var(--muted); }
      .metric p { margin: 7px 0 0; color: var(--muted); font-size: 10px; line-height: 1.45; }
      .risklist { margin: 12px 0 0; padding: 0; list-style: none; }
      .risklist li {
        position: relative;
        padding: 10px 10px 10px 28px;
        border-top: 1px solid var(--line);
        font-size: 10px;
        line-height: 1.4;
      }
      .risklist li::before { content: "!"; position: absolute; left: 9px; color: var(--amber); font-weight: 900; }
      .gate {
        height: 100%;
        padding: 18px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .gate h3 { margin: 0; font-size: 15px; }
      .gate p { margin: 8px 0 0; color: var(--muted); font-size: 10px; line-height: 1.55; }
      .gates { margin-top: 16px; display: grid; gap: 9px; }
      .gateitem { display: flex; align-items: center; gap: 9px; font-size: 10px; font-weight: 800; }
      .gateitem i {
        width: 20px;
        height: 20px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--brand-soft);
        color: var(--success);
        font-style: normal;
      }
      .mock {
        padding: 11px 12px;
        border: 1px solid #f0cfaa;
        background: var(--amber-soft);
        color: #7a2e0e;
        font-size: 10px;
        line-height: 1.5;
      }
      .return-layout { height: 100%; display: grid; grid-template-columns: .8fr 1.2fr; gap: 16px; }
      .timeline { padding: 18px; background: #fff; border: 1px solid var(--line); border-radius: 7px; }
      .timeline h3 { margin: 0 0 16px; font-size: 15px; }
      .event { position: relative; padding: 0 0 16px 28px; color: var(--muted); font-size: 10px; line-height: 1.4; }
      .event::before {
        content: "✓";
        position: absolute;
        left: 0;
        top: -2px;
        width: 18px;
        height: 18px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--brand);
        color: #fff;
        font-size: 10px;
        font-weight: 900;
      }
      .event::after { content: ""; position: absolute; left: 8px; top: 18px; bottom: 0; width: 1px; background: var(--line); }
      .event:last-child::after { display: none; }
      .event b { display: block; color: var(--ink); font-size: 11px; margin-bottom: 3px; }
      .proof {
        padding: 18px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .proof h3 { margin: 0; font-size: 15px; }
      .proof p { margin: 6px 0 0; color: var(--muted); font-size: 10px; }
      .tracking {
        align-self: center;
        padding: 18px;
        border: 1px solid #b8dcd3;
        background: #f2faf7;
        text-align: center;
      }
      .tracking small { color: var(--muted); font-size: 9px; }
      .tracking strong { display: block; margin-top: 8px; color: var(--brand-dark); font-size: 22px; font-family: ui-monospace, Consolas, monospace; }
      .finalstatus { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; border-top: 1px solid var(--line); }
      .finalstatus b { color: var(--success); font-size: 14px; }
      .endmark {
        width: 74px;
        height: 74px;
        margin: 0 auto 26px;
        display: grid;
        place-items: center;
        border: 1px solid #4f746c;
        border-radius: 12px;
        color: #8fe0cf;
        font-size: 28px;
        font-weight: 900;
      }
      .boundaries { margin-top: 28px; color: #8fa39e; font-size: 13px; }
      .footer {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 clamp(32px, 4vw, 72px);
        color: #829690;
        border-top: 1px solid rgba(255,255,255,.08);
        font-size: 10px;
      }
      .progress { position: absolute; left: 0; top: -2px; width: 0; height: 2px; background: #64d1b9; }
      .error {
        position: fixed;
        left: 50%;
        bottom: 52px;
        z-index: 20;
        transform: translateX(-50%);
        padding: 10px 14px;
        border: 1px solid #f5b8b2;
        background: #fff1f0;
        color: var(--danger);
        font-size: 12px;
        display: none;
      }
      @media (max-aspect-ratio: 4/3) {
        .scene { grid-template-columns: .68fr 1.32fr; padding-left: 42px; padding-right: 42px; gap: 34px; }
        h2 { font-size: 42px; }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <header class="topbar">
        <div class="brand">
          <div class="mark">M</div>
          <div><strong>MadeForAI</strong><span>Reality Supply Chain</span></div>
        </div>
        <div class="meta">
          <span class="live">REAL WORKFLOW</span>
          <span class="clock" id="clock">00:00</span>
          <button class="replay" id="replay" type="button" title="重新播放" aria-label="重新播放">↻</button>
        </div>
      </header>

      <section class="stage">
        <article class="scene hook active" data-scene="0">
          <div>
            <p class="eyebrow">60 秒实机 POC</p>
            <h1>AI 已经会创造。<br /><span class="accent">但现实世界还不会执行。</span></h1>
            <p class="sub">MadeForAI 把一句话，变成一条可追踪的现实供应链任务。</p>
          </div>
        </article>

        <article class="scene" data-scene="1">
          <div class="copy">
            <p class="eyebrow">01 · AI CLIENT</p>
            <h2>一句话，<br />发起制造任务</h2>
            <p>用户留在自己的 Codex、Claude 或 Gemini 中。MadeForAI 接收需求，并调用真实 MCP 工作流。</p>
          </div>
          <div class="product">
            <div class="windowbar">
              <div class="windowbrand"><i>M</i> MadeForAI · Manufacturing Agent</div>
              <div class="windowmeta">Codex · Claude · Gemini</div>
            </div>
            <div class="workflow">
              <span class="on"><b>1 Brief</b>Make it producible</span>
              <span><b>2 Order draft</b>User approval</span>
              <span><b>3 Reality review</b>Quote and risks</span>
              <span><b>4 Production</b>Payment gated</span>
              <span><b>5 Delivery</b>Proof returned</span>
            </div>
            <div class="windowbody">
              <div class="split">
                <div class="panel">
                  <div class="panelhead">
                    <div class="agent"><div class="avatar">AI</div><div><strong>Manufacturing agent</strong><small>Connected to a human Reality Operator</small></div></div>
                    <span class="status">Guided run</span>
                  </div>
                  <div class="feed">
                    <div class="message">Tell me what you want to make. I will turn it into a production brief and route the confirmed task to China.</div>
                    <div class="message user">I want to make 500 waterproof vinyl sticker packs. Each pack has 10 kiss-cut stickers with matte lamination. Ship to Los Angeles.</div>
                    <div class="tool">
                      <div class="tooltop"><code>create_supplychain_task</code><span class="check">✓</span></div>
                      <p>Validated with Zod · Local manufacturing rules applied · No external LLM call</p>
                    </div>
                  </div>
                </div>
                <div class="panel">
                  <div class="panelhead"><div><strong>Reality task</strong><small id="taskState">Creating structured task…</small></div><span class="status">Draft</span></div>
                  <div class="taskempty"><div><strong id="taskReady">Waiting for MCP result</strong><br /><span id="taskId">task_••••••••</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="scene" data-scene="2">
          <div class="copy">
            <p class="eyebrow">02 · STRUCTURED TASK</p>
            <h2>不是聊天记录。<br /><span class="accent">是可执行任务。</span></h2>
            <p>产品、数量、材质、工艺、包装、目的地和缺失项进入同一份生产记录。用户确认前，不会流入生产。</p>
          </div>
          <div class="product">
            <div class="windowbar">
              <div class="windowbrand"><i>M</i> Reality task</div>
              <div class="windowmeta task-id-copy">task_••••••••</div>
            </div>
            <div class="workflow">
              <span class="on"><b>1 Brief</b>Complete</span>
              <span class="on"><b>2 Order draft</b>User approval</span>
              <span><b>3 Reality review</b>Pending</span>
              <span><b>4 Production</b>Locked</span>
              <span><b>5 Delivery</b>Locked</span>
            </div>
            <div class="windowbody">
              <div class="panel" style="height:100%">
                <div class="panelhead"><div><strong>Waterproof vinyl sticker pack</strong><small>Production-ready order draft</small></div><span class="status">Awaiting approval</span></div>
                <div class="specgrid">
                  <div class="spec"><small>QUANTITY</small><strong>500 packs · 10 stickers / pack</strong></div>
                  <div class="spec"><small>MATERIAL</small><strong>Waterproof vinyl</strong></div>
                  <div class="spec"><small>SIZE</small><strong>80 × 80 mm average</strong></div>
                  <div class="spec"><small>PROCESS</small><strong>Print · kiss cut · matte lamination</strong></div>
                  <div class="spec"><small>PACKAGING</small><strong>Clear OPP bag · export carton</strong></div>
                  <div class="spec"><small>DESTINATION</small><strong>Los Angeles, USA</strong></div>
                </div>
                <div class="approval"><b>Human approval gate</b><p>No supplier quote, production, payment or shipment can proceed until the user confirms this draft.</p></div>
                <div class="buttonrow"><button class="button primary" type="button">Confirm and send to operator</button><button class="button" type="button">Request revision</button></div>
              </div>
            </div>
          </div>
        </article>

        <article class="scene" data-scene="3">
          <div class="copy">
            <p class="eyebrow">03 · REALITY OPERATOR</p>
            <h2>AI 的语言，<br />自动变成<span class="accent">生产语言</span></h2>
            <p>全球用户端自适应语言，生产端固定中文。义乌 Reality Operator 收到的是能核工艺、问供应商、填交期的任务单。</p>
          </div>
          <div class="product">
            <div class="windowbar">
              <div class="windowbrand"><i>M</i> MadeForAI · 现实供应链生产后台</div>
              <div class="windowmeta">人工执行 · 中文工作台</div>
            </div>
            <div class="windowbody" style="height:calc(100% - 54px);padding:0">
              <div class="operator-layout">
                <aside class="queue">
                  <h3>任务队列</h3>
                  <div class="search">搜索产品、任务号或状态</div>
                  <div class="queueitem"><strong>防水乙烯基贴纸套装</strong><span>待报价 · 500 套</span></div>
                </aside>
                <section class="workspace">
                  <div class="workspace-title"><div><h3>防水乙烯基贴纸套装</h3><p class="task-id-copy">task_••••••••</p></div><span class="status">人工审核中</span></div>
                  <div class="tabs"><span class="on">需求单</span><span>报价与交期</span><span>样品</span><span>生产与质检</span><span>物流交付</span></div>
                  <div class="production-grid">
                    <div class="spec"><small>数量</small><strong>500 套</strong></div>
                    <div class="spec"><small>材质</small><strong>防水乙烯基材料</strong></div>
                    <div class="spec"><small>工艺</small><strong>彩印、吻切、哑膜</strong></div>
                    <div class="spec"><small>目的地</small><strong>美国洛杉矶</strong></div>
                  </div>
                  <div class="sheet">
                    <div class="sheethead"><strong>中文生产需求单</strong><small>由 AI 需求结构化生成 · 人工审核</small></div>
                    <div class="brief">
                      产品：防水乙烯基贴纸套装<br />
                      规格：单枚平均 80 × 80 mm，每套 10 枚吻切贴纸<br />
                      工艺：乙烯基彩印、吻切、表面覆哑膜<br />
                      包装：透明 OPP 袋独立包装，外箱适合出口运输<br />
                      图稿：高清 PNG 或矢量文件，含吻切线、出血位和安全区<br />
                      备注：价格、交期和材料必须由 Reality Operator 人工确认
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </article>

        <article class="scene" data-scene="4">
          <div class="copy">
            <p class="eyebrow">04 · HUMAN GATES</p>
            <h2>价格不由 AI 编造。<br /><span class="accent">承诺来自真人。</span></h2>
            <p>操作员提交报价、交期和风险。用户接受这一份报价快照后，付款门槛才开启；POC 使用 Mock 支付，不处理真实资金。</p>
          </div>
          <div class="product">
            <div class="windowbar">
              <div class="windowbrand"><i>M</i> Reality review</div>
              <div class="windowmeta">Quote snapshot locked</div>
            </div>
            <div class="workflow">
              <span class="on"><b>1 Brief</b>Complete</span>
              <span class="on"><b>2 Order draft</b>Approved</span>
              <span class="on"><b>3 Reality review</b>Quote received</span>
              <span><b>4 Production</b>Payment gated</span>
              <span><b>5 Delivery</b>Locked</span>
            </div>
            <div class="windowbody">
              <div class="quote-layout">
                <section class="metric">
                  <small>OPERATOR-CONFIRMED QUOTE</small>
                  <div class="amount"><span>CNY</span> <b id="quoteAmount">600.00</b></div>
                  <p>5–7 days after proof approval · 5–8 days air freight</p>
                  <ul class="risklist">
                    <li>Fine cut lines require proof approval before mass production.</li>
                    <li>Waterproof vinyl stock must be confirmed by the operator.</li>
                  </ul>
                </section>
                <section class="gate">
                  <div>
                    <h3>Approval chain</h3>
                    <p>Every irreversible step is blocked until the previous human decision is recorded.</p>
                    <div class="gates">
                      <div class="gateitem"><i>✓</i> User approved production draft</div>
                      <div class="gateitem"><i>✓</i> Operator confirmed quote and risks</div>
                      <div class="gateitem"><i>✓</i> User accepted quote snapshot</div>
                    </div>
                  </div>
                  <div class="mock"><strong>Mock payment only</strong><br />No real payment, card data or automatic order is processed in v0.4.0.</div>
                </section>
              </div>
            </div>
          </div>
        </article>

        <article class="scene" data-scene="5">
          <div class="copy">
            <p class="eyebrow">05 · CLOSED LOOP</p>
            <h2>每一次现实进展，<br /><span class="accent">回到同一条 AI 任务</span></h2>
            <p>生产、质检、物流和交付证据不再散落在聊天、表格与私信里。AI 随时查询，用户看到的是真实状态。</p>
          </div>
          <div class="product">
            <div class="windowbar">
              <div class="windowbrand"><i>M</i> Delivery record</div>
              <div class="windowmeta task-id-copy">task_••••••••</div>
            </div>
            <div class="workflow">
              <span class="on"><b>1 Brief</b>Complete</span>
              <span class="on"><b>2 Order draft</b>Approved</span>
              <span class="on"><b>3 Reality review</b>Confirmed</span>
              <span class="on"><b>4 Production</b>Quality checked</span>
              <span class="on"><b>5 Delivery</b>Proof returned</span>
            </div>
            <div class="windowbody">
              <div class="return-layout">
                <section class="timeline">
                  <h3>Reality task history</h3>
                  <div class="event"><b>Payment gate confirmed</b>Mock workflow confirmation recorded</div>
                  <div class="event"><b>Production started</b>Human operator updated progress</div>
                  <div class="event"><b>Quality check passed</b>Shipment unlocked only after QC</div>
                  <div class="event"><b>Shipment submitted</b>Tracking returned to the AI client</div>
                  <div class="event"><b>Delivery completed</b>Evidence attached to the same task</div>
                </section>
                <section class="proof">
                  <div><h3>Proof returned to AI</h3><p>The agent can now answer the user with verified task data.</p></div>
                  <div class="tracking"><small>TRACKING NUMBER</small><strong id="trackingNumber">USERDEMO123</strong></div>
                  <div class="finalstatus"><span>Quality check · Shipment · Delivery</span><b id="finalStatus">COMPLETED ✓</b></div>
                </section>
              </div>
            </div>
          </div>
        </article>

        <article class="scene close" data-scene="6">
          <div>
            <div class="endmark">M</div>
            <p class="eyebrow">MADEFORAI · REALITY SUPPLY CHAIN</p>
            <h1>AI 发任务。<br /><span class="accent">人做承诺。</span></h1>
            <p class="sub">把智能，真正带到现实。</p>
            <p class="boundaries">Human approval first · No automatic ordering · Mock payment only</p>
          </div>
        </article>
      </section>

      <footer class="footer">
        <div class="progress" id="progress"></div>
        <span>AI → 中国现实供应链</span>
        <span>v0.4.0 · 16 MCP tools · Human approval first</span>
      </footer>
    </main>
    <div class="error" id="error">演示接口暂时不可用，画面将使用本地占位信息继续播放。</div>

    <script>
      const duration = 58;
      const cues = [
        { at: 0, scene: 0 },
        { at: 6, scene: 1 },
        { at: 15, scene: 2 },
        { at: 25, scene: 3 },
        { at: 37, scene: 4 },
        { at: 47, scene: 5 },
        { at: 55, scene: 6 }
      ];
      let startedAt = 0;
      let timer = 0;
      let running = false;

      function setScene(index) {
        document.querySelectorAll(".scene").forEach((scene) => {
          scene.classList.toggle("active", Number(scene.dataset.scene) === index);
        });
      }

      function formatClock(seconds) {
        return "00:" + String(Math.max(0, Math.min(59, Math.floor(seconds)))).padStart(2, "0");
      }

      function tick(now) {
        if (!running) return;
        const elapsed = Math.min(duration, (now - startedAt) / 1000);
        const cue = [...cues].reverse().find((item) => elapsed >= item.at) || cues[0];
        setScene(cue.scene);
        document.getElementById("clock").textContent = formatClock(elapsed);
        document.getElementById("progress").style.width = (elapsed / duration * 100) + "%";
        if (elapsed >= duration) {
          running = false;
          document.getElementById("clock").textContent = "00:58";
          return;
        }
        timer = requestAnimationFrame(tick);
      }

      function play() {
        cancelAnimationFrame(timer);
        setScene(0);
        document.getElementById("clock").textContent = "00:00";
        document.getElementById("progress").style.width = "0";
        startedAt = performance.now();
        running = true;
        timer = requestAnimationFrame(tick);
      }

      function compactTaskId(value) {
        if (!value) return "task_••••••••";
        return value.length > 24 ? value.slice(0, 14) + "…" + value.slice(-6) : value;
      }

      async function loadRealityData() {
        try {
          const response = await fetch("/user/api/run", { method: "POST" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "POC workflow failed");
          const taskId = compactTaskId(data.task_id);
          document.getElementById("taskState").textContent = "Structured task created";
          document.getElementById("taskReady").textContent = "Human operator required";
          document.getElementById("taskId").textContent = taskId;
          document.querySelectorAll(".task-id-copy").forEach((node) => { node.textContent = taskId; });
          const rawQuote = data.production_feedback?.total_amount || data.production_feedback?.quote || "600.00";
          const quoteMatch = String(rawQuote).match(/[0-9]+(?:\\.[0-9]{1,2})?/);
          if (quoteMatch) document.getElementById("quoteAmount").textContent = Number(quoteMatch[0]).toFixed(2);
          document.getElementById("trackingNumber").textContent = data.status?.tracking_number || "USERDEMO123";
          document.getElementById("finalStatus").textContent =
            String(data.status?.final_status || "completed").toUpperCase() + " ✓";
          document.body.dataset.workflow = "verified";
        } catch (error) {
          document.body.dataset.workflow = "fallback";
          const banner = document.getElementById("error");
          banner.style.display = "block";
          setTimeout(() => { banner.style.display = "none"; }, 5000);
        }
      }

      document.getElementById("replay").addEventListener("click", play);
      loadRealityData();
      const params = new URLSearchParams(location.search);
      if (params.get("autoplay") !== "0") setTimeout(play, params.get("record") === "1" ? 250 : 700);
    </script>
  </body>
</html>`;
}
