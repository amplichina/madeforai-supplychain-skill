export const TASK_STATUSES = [
  "created",
  "operator_reviewing",
  "quote_requested",
  "quote_received",
  "sample_ordered",
  "sample_ready",
  "order_draft_created",
  "user_confirmed",
  "production_requested",
  "production_feedback_received",
  "payment_link_created",
  "payment_confirmed",
  "production_ready",
  "production_in_progress",
  "quality_check",
  "user_rejected",
  "shipped",
  "completed",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  created: ["operator_reviewing", "quote_requested", "order_draft_created", "cancelled"],
  operator_reviewing: ["quote_requested", "quote_received", "production_requested", "cancelled"],
  quote_requested: ["quote_received", "operator_reviewing", "cancelled"],
  quote_received: ["order_draft_created", "production_requested", "cancelled"],
  sample_ordered: ["sample_ready", "production_ready", "cancelled"],
  sample_ready: ["production_ready", "production_in_progress", "cancelled"],
  order_draft_created: ["user_confirmed", "user_rejected", "cancelled"],
  user_confirmed: ["production_requested", "cancelled"],
  production_requested: ["production_feedback_received", "cancelled"],
  production_feedback_received: ["payment_link_created", "user_rejected", "cancelled"],
  payment_link_created: [
    "payment_confirmed",
    "production_feedback_received",
    "user_rejected",
    "cancelled",
  ],
  payment_confirmed: ["sample_ordered", "production_ready", "production_in_progress", "cancelled"],
  production_ready: ["production_in_progress", "cancelled"],
  production_in_progress: ["quality_check", "cancelled"],
  quality_check: ["shipped", "production_in_progress", "cancelled"],
  user_rejected: ["order_draft_created", "cancelled"],
  shipped: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isTransitionAllowed(from: string, to: TaskStatus): boolean {
  if (from === to) return true;
  if (!TASK_STATUSES.includes(from as TaskStatus)) return false;
  return ALLOWED_TRANSITIONS[from as TaskStatus].includes(to);
}
