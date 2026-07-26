import type { StoredTask } from "../tools/store.js";

export interface CategoryObservations {
  category: string;
  completed_orders_seen: number;
  orders_with_operator_quote: number;
  orders_with_recorded_lead_time: number;
  quantity_range_seen: { min: number; max: number } | null;
  note: { en: string; zh: string };
}

function hasTextField(record: unknown, key: string): boolean {
  if (!record || typeof record !== "object") return false;
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0;
}

export function deriveCategoryObservations(
  tasks: StoredTask[],
  category: string,
): CategoryObservations | undefined {
  const completed = tasks.filter(
    (task) => task.productCategory === category && task.status === "completed",
  );
  if (completed.length === 0) return undefined;

  const quantities = completed
    .map((task) => task.quantity)
    .filter((quantity): quantity is number => typeof quantity === "number" && Number.isFinite(quantity));

  return {
    category,
    completed_orders_seen: completed.length,
    orders_with_operator_quote: completed.filter((task) =>
      hasTextField(task.productionFeedback, "total_amount"),
    ).length,
    orders_with_recorded_lead_time: completed.filter((task) =>
      hasTextField(task.productionFeedback, "estimated_production_time"),
    ).length,
    quantity_range_seen:
      quantities.length > 0
        ? { min: Math.min(...quantities), max: Math.max(...quantities) }
        : null,
    note: {
      en: "Anonymous completed-order coverage only. Raw historical prices, lead times, supplier identities, and task details are never shared. This is not a quote.",
      zh: "仅提供匿名的已完成订单覆盖数据，不返回历史价格、具体交期、供应商身份或订单详情，也不能视为本单报价。",
    },
  };
}
