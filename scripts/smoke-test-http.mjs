import "dotenv/config";
import { URL } from "node:url";

const endpoint = process.env.MCP_ENDPOINT ?? "http://localhost:3000/mcp";
const serviceOrigin = new URL(endpoint).origin;
const mcpApiKey = process.env.MCP_HTTP_API_KEY?.trim();

async function callMcp(id, method, params = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(mcpApiKey ? { authorization: `Bearer ${mcpApiKey}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`MCP request failed (${response.status}): ${text}`);
  }

  const dataLine = text.split(/\r?\n/).find((line) => line.startsWith("data: "));
  if (!dataLine) {
    throw new Error(`Could not parse MCP SSE response: ${text}`);
  }

  const message = JSON.parse(dataLine.slice("data: ".length));
  if (message.error) {
    throw new Error(JSON.stringify(message.error, null, 2));
  }

  return message.result;
}

function parseToolText(result) {
  const text = result?.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error(`Tool result did not include text content: ${JSON.stringify(result)}`);
  }
  return JSON.parse(text);
}

console.log(`Testing MadeForAI MCP server at ${endpoint}`);

await callMcp(1, "initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "madeforai-smoke-test", version: "0.1.2" },
});

const tools = await callMcp(2, "tools/list");
console.log(`Tools exposed: ${tools.tools.map((tool) => tool.name).join(", ")}`);

const artworkBrief = parseToolText(
  await callMcp(3, "tools/call", {
    name: "generate_artwork_brief",
    arguments: {
      product_category: "badge",
      product_name: "Custom enamel badge sample",
      manufacturing_goal: "Prepare production artwork before creating the supply chain task.",
      quantity: 200,
      target_market: "US",
      language: "en",
    },
  }),
);
console.log(
  `Generated artwork brief with ${artworkBrief.production_artwork_checklist.length} checklist items`,
);

const created = parseToolText(
  await callMcp(4, "tools/call", {
    name: "create_supplychain_task",
    arguments: {
      title: "Custom enamel badge sample",
      description:
        "Need 200 small-batch enamel badges for a merch drop, with manual supplier quote and sample feedback.",
      product_category: "badge",
      quantity: 200,
      budget_range: "manual quote required",
      target_market: "US",
      asset_urls: ["https://example.com/artwork.png"],
      shipping_destination: "Los Angeles, CA",
    },
  }),
);
console.log(`Created task: ${created.task_id}`);

const quote = parseToolText(
  await callMcp(5, "tools/call", {
    name: "generate_quote_request",
    arguments: { task_id: created.task_id, language: "zh" },
  }),
);
console.log(
  `Generated Chinese quote request with ${quote.supplier_checklist.length} checklist items`,
);

const draft = parseToolText(
  await callMcp(6, "tools/call", {
    name: "generate_order_draft",
    arguments: { task_id: created.task_id },
  }),
);
console.log(`Generated order draft. Readiness: ${draft.order_draft.production_readiness}`);

const confirmation = parseToolText(
  await callMcp(7, "tools/call", {
    name: "confirm_order_draft",
    arguments: {
      task_id: created.task_id,
      confirmed: true,
      message: "Smoke test user approved the order draft.",
    },
  }),
);
console.log(`Confirmed order draft. Production request: ${confirmation.production_request.status}`);

const feedback = parseToolText(
  await callMcp(8, "tools/call", {
    name: "submit_production_feedback",
    arguments: {
      task_id: created.task_id,
      feasible: true,
      confirmed_process: "hard enamel with electroplating",
      quote: "Manual confirmation required: supplier quote received",
      total_amount: "199.00",
      currency: "USD",
      sample_cost: "Manual confirmation required",
      estimated_production_time: "12-15 days after sample approval",
      estimated_shipping_time: "5-8 days",
      risks: ["Color matching requires sample approval"],
    },
  }),
);
console.log(`Submitted production feedback. Status: ${feedback.status}`);

const feedbackConfirmation = parseToolText(
  await callMcp(9, "tools/call", {
    name: "confirm_production_feedback",
    arguments: {
      task_id: created.task_id,
      accepted: true,
      accepted_quote_id: feedback.production_feedback.quote_id,
      accepted_risks: true,
    },
  }),
);
console.log(`Confirmed operator quote: ${feedbackConfirmation.status}`);

const payment = parseToolText(
  await callMcp(10, "tools/call", {
    name: "create_payment_link",
    arguments: {
      task_id: created.task_id,
      accepted_quote_id: feedback.production_feedback.quote_id,
      description: "Smoke test mock payment link",
    },
  }),
);
console.log(`Created mock payment link: ${payment.payment_intent.payment_url}`);

const paymentConfirmation = parseToolText(
  await callMcp(11, "tools/call", {
    name: "confirm_mock_payment",
    arguments: {
      task_id: created.task_id,
      payment_id: payment.payment_intent.payment_id,
      confirmed: true,
      message: "Smoke test mock payment confirmation",
    },
  }),
);
console.log(`Confirmed mock payment. Status: ${paymentConfirmation.status}`);

const production = parseToolText(
  await callMcp(11, "tools/call", {
    name: "update_production_status",
    arguments: {
      task_id: created.task_id,
      stage: "production_in_progress",
      message: "Smoke test production has started.",
      production_photos: ["https://example.com/production.jpg"],
    },
  }),
);
console.log(`Updated production status: ${production.status}`);

const qualityCheck = parseToolText(
  await callMcp(12, "tools/call", {
    name: "update_production_status",
    arguments: {
      task_id: created.task_id,
      stage: "quality_check",
      message: "Smoke test quality check passed.",
      production_photos: ["https://example.com/quality-check.jpg"],
    },
  }),
);
console.log(`Updated quality status: ${qualityCheck.status}`);

const shipment = parseToolText(
  await callMcp(13, "tools/call", {
    name: "submit_shipment_info",
    arguments: {
      task_id: created.task_id,
      carrier: "Mock Air",
      tracking_number: "TRACK123",
      tracking_url: "https://example.com/track/TRACK123",
      estimated_delivery: "5-8 days",
    },
  }),
);
console.log(`Submitted shipment info. Tracking: ${shipment.shipment.tracking_number}`);

const completion = parseToolText(
  await callMcp(14, "tools/call", {
    name: "complete_task",
    arguments: {
      task_id: created.task_id,
      completion_notes: "Smoke test delivery completed.",
      proof_urls: ["https://example.com/delivery-proof.jpg"],
    },
  }),
);
console.log(`Completed task. Status: ${completion.status}`);

const uploaded = parseToolText(
  await callMcp(15, "tools/call", {
    name: "upload_sample_result",
    arguments: {
      task_id: created.task_id,
      sample_images: ["https://example.com/sample.jpg"],
      quoted_price: "Manual confirmation required: supplier estimate received",
      production_time: "7-10 days after sample approval",
      supplier_feedback: "Supplier recommends hard enamel for a smoother finish.",
      quality_notes: "Check plating, enamel fill, and edge polishing before bulk production.",
      shipping_info: "Manual logistics quote required.",
    },
  }),
);
console.log(`Uploaded sample result. Status: ${uploaded.status}`);

const loaded = parseToolText(
  await callMcp(16, "tools/call", {
    name: "get_task",
    arguments: { task_id: created.task_id },
  }),
);
console.log(`Loaded task ${loaded.task_id}. Final status: ${loaded.status}`);

const operatorUsername = process.env.OPERATOR_USERNAME?.trim() || "operator";
const operatorPassword = process.env.OPERATOR_PASSWORD;
if (!operatorPassword) {
  throw new Error("OPERATOR_PASSWORD is required to verify the protected operator console.");
}

const operatorLoginResponse = await fetch(`${serviceOrigin}/operator/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ username: operatorUsername, password: operatorPassword }),
});
if (!operatorLoginResponse.ok) {
  throw new Error(`Operator login failed: ${operatorLoginResponse.status}`);
}
const operatorCookie = operatorLoginResponse.headers.get("set-cookie")?.split(";")[0];
if (!operatorCookie) {
  throw new Error("Operator login did not return a session cookie.");
}

const operatorTasksResponse = await fetch(`${serviceOrigin}/operator/api/tasks`, {
  headers: { cookie: operatorCookie },
});
if (!operatorTasksResponse.ok) {
  throw new Error(`Operator task list failed: ${operatorTasksResponse.status}`);
}
const operatorTasks = await operatorTasksResponse.json();
if (!operatorTasks.some((task) => task.task_id === created.task_id)) {
  throw new Error("Created task was not visible in the operator console API.");
}
console.log(`Operator console API lists ${operatorTasks.length} task(s).`);

console.log("MadeForAI MCP smoke test passed.");
