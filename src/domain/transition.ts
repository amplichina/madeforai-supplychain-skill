import {
  isTransitionAllowed,
  type TaskStatus,
} from "./taskStatus.js";

const TERMINAL_STATUSES: ReadonlySet<string> = new Set(["completed", "cancelled"]);

export type TransitionRequest = {
  from: string;
  to: TaskStatus;
  by: string;
  allowedFrom?: readonly TaskStatus[];
  allowCompoundTransition?: boolean;
};

export function assertTransition({
  from,
  to,
  by,
  allowedFrom,
  allowCompoundTransition = false,
}: TransitionRequest): void {
  if (TERMINAL_STATUSES.has(from) && from !== to) {
    throw new Error(`Task is ${from}; ${by} can no longer change it. Terminal states are final.`);
  }
  if (allowedFrom?.length && !allowedFrom.includes(from as TaskStatus)) {
    throw new Error(
      `${by} is not valid from status "${from}". Expected one of: ${allowedFrom.join(", ")}. Call get_task and follow guidance.suggested_next_tool.`,
    );
  }
  if (!allowCompoundTransition && !isTransitionAllowed(from, to)) {
    throw new Error(`Invalid task status transition: ${from} -> ${to} (via ${by}).`);
  }
}
