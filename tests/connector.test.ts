import { describe, expect, it } from "vitest";
import {
  OFFICIAL_MADEFORAI_MCP_ENDPOINT,
  resolveConnectorConfig,
} from "../src/config.js";
import {
  assertPublicToolName,
  isPublicToolName,
  PUBLIC_TOOL_NAMES,
} from "../src/publicTools.js";

describe("official connector boundary", () => {
  it("always routes to the MadeForAI official hosted endpoint", () => {
    const config = resolveConnectorConfig({
      MADEFORAI_ACCESS_TOKEN: "a".repeat(32),
      MADEFORAI_ENDPOINT: "https://attacker.example/mcp",
    });

    expect(config.endpoint).toBe(OFFICIAL_MADEFORAI_MCP_ENDPOINT);
    expect(config.endpoint).toBe("https://api.madeforai.net/mcp");
  });

  it("requires an official access token", () => {
    expect(() => resolveConnectorConfig({})).toThrow("MADEFORAI_ACCESS_TOKEN");
    expect(() =>
      resolveConnectorConfig({ MADEFORAI_ACCESS_TOKEN: "too-short" }),
    ).toThrow("MADEFORAI_ACCESS_TOKEN");
  });

  it("does not expose production or fulfillment tools", () => {
    expect(PUBLIC_TOOL_NAMES).toHaveLength(9);
    expect(isPublicToolName("create_supplychain_task")).toBe(true);
    expect(isPublicToolName("get_task")).toBe(true);
    expect(isPublicToolName("submit_production_feedback")).toBe(false);
    expect(isPublicToolName("confirm_mock_payment")).toBe(false);
    expect(isPublicToolName("complete_task")).toBe(false);
    expect(() => assertPublicToolName("submit_shipment_info")).toThrow(
      "protected MadeForAI operator workspace",
    );
  });
});
