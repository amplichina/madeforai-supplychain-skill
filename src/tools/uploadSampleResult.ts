import { UploadSampleResultInputSchema } from "../domain/schemas.js";
import { assertTransition } from "../domain/transition.js";
import { createEventId, createSampleResultId } from "../utils/ids.js";
import type { SupplyChainStore } from "./store.js";

export type UploadSampleResultOutput = {
  task_id: string;
  status: string;
  result_summary: {
    quoted_price?: string;
    production_time?: string;
    quality_notes?: string;
    shipping_info?: string;
  };
};

export async function uploadSampleResult(
  input: unknown,
  store: SupplyChainStore,
): Promise<UploadSampleResultOutput> {
  const parsed = UploadSampleResultInputSchema.parse(input);
  const task = await store.getTask(parsed.task_id);
  if (!task) {
    throw new Error(`Task not found: ${parsed.task_id}`);
  }

  await store.createSampleResult({
    id: createSampleResultId(),
    taskId: parsed.task_id,
    sampleImages: parsed.sample_images,
    sampleVideos: parsed.sample_videos,
    quotedPrice: parsed.quoted_price,
    productionTime: parsed.production_time,
    supplierFeedback: parsed.supplier_feedback,
    qualityNotes: parsed.quality_notes,
    shippingInfo: parsed.shipping_info,
  });

  let updatedStatus = task.status;
  if (task.status === "sample_ordered") {
    assertTransition({
      from: task.status,
      to: "sample_ready",
      by: "upload_sample_result",
      allowedFrom: ["sample_ordered"],
    });
    const updated = await store.updateTaskStatus(parsed.task_id, "sample_ready");
    updatedStatus = updated.status;
  }

  await store.createEvent({
    id: createEventId(),
    taskId: parsed.task_id,
    type: "sample_result_uploaded",
    message: "Human Reality Operator uploaded sample or supplier result.",
    metadata: {
      has_images: Boolean(parsed.sample_images?.length),
      has_videos: Boolean(parsed.sample_videos?.length),
      quoted_price: parsed.quoted_price,
      production_time: parsed.production_time,
    },
  });

  return {
    task_id: parsed.task_id,
    status: updatedStatus,
    result_summary: {
      quoted_price: parsed.quoted_price,
      production_time: parsed.production_time,
      quality_notes: parsed.quality_notes,
      shipping_info: parsed.shipping_info,
    },
  };
}
