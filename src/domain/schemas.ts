import { z } from "zod";
import { TASK_STATUSES } from "./taskStatus.js";

export const ProductCategorySchema = z.enum([
  "badge",
  "acrylic",
  "card",
  "packaging_card",
  "sticker",
  "print_collateral",
  "exhibition_display",
  "apparel",
  "small_batch_merch",
  "other",
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const InitialAssessmentSchema = z.object({
  likely_processes: z.array(z.string()),
  key_risks: z.array(z.string()),
  questions_for_user: z.array(z.string()),
  estimated_complexity: z.enum(["low", "medium", "high"]),
});

export type InitialAssessment = z.infer<typeof InitialAssessmentSchema>;

export const UserLanguageSchema = z.enum(["auto", "en", "zh"]);

export const CreateSupplyChainTaskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  product_category: ProductCategorySchema,
  product_name: z.string().max(200).optional(),
  quantity: z.number().int().positive().optional(),
  material: z.string().max(300).optional(),
  dimensions: z.string().max(300).optional(),
  process: z.string().max(300).optional(),
  color_requirements: z.string().max(1000).optional(),
  packaging_requirements: z.string().max(1000).optional(),
  artwork_requirements: z.string().max(1000).optional(),
  budget_range: z.string().max(200).optional(),
  target_market: z.string().max(200).optional(),
  asset_urls: z.array(z.string().url()).max(20).optional(),
  deadline: z.string().max(100).optional(),
  shipping_destination: z.string().max(300).optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateSupplyChainTaskInput = z.infer<typeof CreateSupplyChainTaskInputSchema>;

export const GenerateArtworkBriefInputSchema = z.object({
  product_category: ProductCategorySchema,
  product_name: z.string().max(200).optional(),
  manufacturing_goal: z.string().max(2000).optional(),
  quantity: z.number().int().positive().optional(),
  target_market: z.string().max(200).optional(),
  language: UserLanguageSchema.default("en"),
});

export type GenerateArtworkBriefInput = z.infer<typeof GenerateArtworkBriefInputSchema>;

export const OrderDraftSchema = z.object({
  product_name: z.string(),
  production_title_zh: z.string().nullable(),
  production_description_zh: z.string().nullable(),
  production_spec_zh: z
    .object({
      material: z.string().nullable(),
      dimensions: z.string().nullable(),
      process: z.string().nullable(),
      color_requirements: z.string().nullable(),
      packaging_requirements: z.string().nullable(),
      artwork_requirements: z.string().nullable(),
      target_market: z.string().nullable(),
      shipping_destination: z.string().nullable(),
      requested_budget_range: z.string().nullable(),
      notes: z.string().nullable(),
    })
    .nullable(),
  product_category: ProductCategorySchema,
  quantity: z.number().int().positive().nullable(),
  material: z.string().nullable(),
  dimensions: z.string().nullable(),
  process: z.string().nullable(),
  color_requirements: z.string().nullable(),
  packaging_requirements: z.string().nullable(),
  artwork_requirements: z.string().nullable(),
  asset_urls: z.array(z.string()),
  target_market: z.string().nullable(),
  shipping_destination: z.string().nullable(),
  requested_budget_range: z.string().nullable(),
  deadline: z.string().nullable(),
  notes: z.string().nullable(),
  price: z.object({
    status: z.literal("requires_human_confirmation"),
    quoted_price: z.null(),
    currency: z.null(),
  }),
  production_readiness: z.enum(["needs_user_input", "needs_operator_review"]),
  missing_requirements: z.array(z.string()),
  confirmation_status: z.enum(["draft", "user_confirmed", "user_rejected"]),
});

export type OrderDraft = z.infer<typeof OrderDraftSchema>;

export const GenerateOrderDraftInputSchema = z.object({
  task_id: z.string().min(1),
  user_language: UserLanguageSchema.default("en"),
  production_title_zh: z.string().min(1).max(200).optional(),
  production_description_zh: z.string().min(1).max(5000).optional(),
  production_spec_zh: z
    .object({
      material: z.string().max(300).optional(),
      dimensions: z.string().max(300).optional(),
      process: z.string().max(300).optional(),
      color_requirements: z.string().max(1000).optional(),
      packaging_requirements: z.string().max(1000).optional(),
      artwork_requirements: z.string().max(1000).optional(),
      target_market: z.string().max(200).optional(),
      shipping_destination: z.string().max(300).optional(),
      requested_budget_range: z.string().max(200).optional(),
      notes: z.string().max(5000).optional(),
    })
    .optional(),
});

export type GenerateOrderDraftInput = z.infer<typeof GenerateOrderDraftInputSchema>;

export const ConfirmOrderDraftInputSchema = z.object({
  task_id: z.string().min(1),
  confirmed: z.boolean(),
  message: z.string().max(2000).optional(),
});

export type ConfirmOrderDraftInput = z.infer<typeof ConfirmOrderDraftInputSchema>;

export const SubmitProductionFeedbackInputShape = {
  task_id: z.string().min(1),
  feasible: z.boolean(),
  confirmed_process: z.string().max(1000).optional(),
  quote: z.string().max(300).optional(),
  total_amount: z
    .string()
    .regex(
      /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
      "Use a positive decimal amount with at most 2 decimals.",
    )
    .refine((value) => Number(value) > 0, "Total amount must be greater than zero.")
    .optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter uppercase currency code such as CNY or USD.")
    .optional(),
  sample_cost: z.string().max(300).optional(),
  estimated_production_time: z.string().max(300).optional(),
  estimated_shipping_time: z.string().max(300).optional(),
  required_clarifications: z.array(z.string().max(1000)).max(20).optional(),
  risks: z.array(z.string().max(1000)).max(20).optional(),
  operator_notes: z.string().max(5000).optional(),
};

export const SubmitProductionFeedbackInputSchema = z
  .object(SubmitProductionFeedbackInputShape)
  .superRefine((value, context) => {
    if (value.total_amount && !value.currency) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currency"],
        message: "currency is required when total_amount is provided.",
      });
    }
    if (value.currency && !value.total_amount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["total_amount"],
        message: "total_amount is required when currency is provided.",
      });
    }
  });

export type SubmitProductionFeedbackInput = z.infer<typeof SubmitProductionFeedbackInputSchema>;

export const ConfirmProductionFeedbackInputSchema = z.object({
  task_id: z.string().min(1),
  accepted: z.boolean(),
  accepted_quote_id: z.string().min(1),
  accepted_risks: z.boolean(),
  message: z.string().max(2000).optional(),
});

export type ConfirmProductionFeedbackInput = z.infer<typeof ConfirmProductionFeedbackInputSchema>;

export const PaymentIntentSchema = z.object({
  provider: z.literal("mock"),
  payment_id: z.string(),
  source_quote_id: z.string().min(1),
  payment_url: z.string().url(),
  amount: z
    .string()
    .regex(
      /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
      "Use a positive decimal amount with at most 2 decimals.",
    )
    .refine((value) => Number(value) > 0, "Payment amount must be greater than zero."),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter uppercase ISO 4217 currency code such as CNY or USD."),
  status: z.enum(["link_created", "confirmed", "cancelled"]),
  created_at: z.string(),
  confirmed_at: z.string().nullable(),
  notes: z.string().nullable(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

export const CreatePaymentLinkInputSchema = z.object({
  task_id: z.string().min(1),
  accepted_quote_id: z.string().min(1),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreatePaymentLinkInput = z.infer<typeof CreatePaymentLinkInputSchema>;

export const ConfirmMockPaymentInputSchema = z.object({
  task_id: z.string().min(1),
  payment_id: z.string().min(1),
  confirmed: z.boolean(),
  message: z.string().max(2000).optional(),
});

export type ConfirmMockPaymentInput = z.infer<typeof ConfirmMockPaymentInputSchema>;

export const ProductionStageSchema = z.enum([
  "production_ready",
  "production_in_progress",
  "quality_check",
]);

export const UpdateProductionStatusInputSchema = z.object({
  task_id: z.string().min(1),
  stage: ProductionStageSchema,
  message: z.string().max(3000).optional(),
  production_photos: z.array(z.string().url()).max(50).optional(),
  operator_notes: z.string().max(5000).optional(),
});

export type UpdateProductionStatusInput = z.infer<typeof UpdateProductionStatusInputSchema>;

export const SubmitShipmentInfoInputSchema = z.object({
  task_id: z.string().min(1),
  carrier: z.string().max(200).optional(),
  tracking_number: z.string().max(300).optional(),
  tracking_url: z.string().url().optional(),
  shipped_at: z.string().max(100).optional(),
  estimated_delivery: z.string().max(200).optional(),
  shipping_notes: z.string().max(3000).optional(),
});

export type SubmitShipmentInfoInput = z.infer<typeof SubmitShipmentInfoInputSchema>;

export const CompleteTaskInputSchema = z.object({
  task_id: z.string().min(1),
  delivered_at: z.string().max(100).optional(),
  completion_notes: z.string().max(5000).optional(),
  proof_urls: z.array(z.string().url()).max(50).optional(),
});

export type CompleteTaskInput = z.infer<typeof CompleteTaskInputSchema>;

export const GenerateQuoteRequestInputSchema = z.object({
  task_id: z.string().min(1),
  language: z.enum(["en", "zh"]).default("zh"),
});

export type GenerateQuoteRequestInput = z.infer<typeof GenerateQuoteRequestInputSchema>;

export const UpdateTaskStatusInputSchema = z.object({
  task_id: z.string().min(1),
  status: z.enum(TASK_STATUSES),
  message: z.string().max(2000).optional(),
});

export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusInputSchema>;

export const UploadSampleResultInputSchema = z.object({
  task_id: z.string().min(1),
  sample_images: z.array(z.string().url()).max(50).optional(),
  sample_videos: z.array(z.string().url()).max(20).optional(),
  quoted_price: z.string().max(300).optional(),
  production_time: z.string().max(300).optional(),
  supplier_feedback: z.string().max(5000).optional(),
  quality_notes: z.string().max(5000).optional(),
  shipping_info: z.string().max(1000).optional(),
});

export type UploadSampleResultInput = z.infer<typeof UploadSampleResultInputSchema>;

export const GetTaskInputSchema = z.object({
  task_id: z.string().min(1),
});

export type GetTaskInput = z.infer<typeof GetTaskInputSchema>;
