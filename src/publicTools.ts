export const PUBLIC_TOOL_NAMES = [
  "create_supplychain_task",
  "generate_artwork_brief",
  "generate_quote_request",
  "generate_order_draft",
  "confirm_order_draft",
  "confirm_production_feedback",
  "create_payment_link",
  "quick_start_prototype_pipeline",
  "get_task",
] as const;

const PUBLIC_TOOL_NAME_SET = new Set<string>(PUBLIC_TOOL_NAMES);

export function isPublicToolName(name: string): boolean {
  return PUBLIC_TOOL_NAME_SET.has(name);
}

export function assertPublicToolName(name: string): void {
  if (!isPublicToolName(name)) {
    throw new Error(
      `Tool "${name}" is not available to public clients. Production and fulfillment actions require the protected MadeForAI operator workspace.`,
    );
  }
}
