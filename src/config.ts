export const OFFICIAL_MADEFORAI_MCP_ENDPOINT = "https://api.madeforai.net/mcp";

export type ConnectorConfig = {
  endpoint: typeof OFFICIAL_MADEFORAI_MCP_ENDPOINT;
  accessToken: string;
};

export function resolveConnectorConfig(
  env: NodeJS.ProcessEnv = process.env,
): ConnectorConfig {
  const accessToken = env.MADEFORAI_ACCESS_TOKEN?.trim();
  if (!accessToken || accessToken.length < 32) {
    throw new Error(
      "MADEFORAI_ACCESS_TOKEN is required. Request an official access token from MadeForAI.",
    );
  }

  return {
    endpoint: OFFICIAL_MADEFORAI_MCP_ENDPOINT,
    accessToken,
  };
}
