import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 18);

export function createTaskId(): string {
  return `task_${nanoid()}`;
}

export function createEventId(): string {
  return `evt_${nanoid()}`;
}

export function createSampleResultId(): string {
  return `sample_${nanoid()}`;
}

export function createQuoteId(): string {
  return `quote_${nanoid()}`;
}
