import type { InitialAssessment } from "../domain/schemas.js";
import type { TaskStatus } from "../domain/taskStatus.js";

export type StoredTask = {
  id: string;
  title: string;
  description: string;
  productCategory: string;
  productName: string | null;
  quantity: number | null;
  material: string | null;
  dimensions: string | null;
  process: string | null;
  colorRequirements: string | null;
  packagingRequirements: string | null;
  artworkRequirements: string | null;
  budgetRange: string | null;
  targetMarket: string | null;
  assetUrls: unknown;
  deadline: string | null;
  shippingDestination: string | null;
  notes: string | null;
  status: string;
  initialAssessment: unknown;
  quoteRequest: unknown;
  orderDraft: unknown;
  userConfirmation: unknown;
  productionRequest: unknown;
  productionFeedback: unknown;
  paymentIntent: unknown;
  fulfillment: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredTaskEvent = {
  id: string;
  taskId: string;
  type: string;
  message: string | null;
  metadata: unknown;
  createdAt: Date;
};

export type StoredSampleResult = {
  id: string;
  taskId: string;
  sampleImages: unknown;
  sampleVideos: unknown;
  quotedPrice: string | null;
  productionTime: string | null;
  supplierFeedback: string | null;
  qualityNotes: string | null;
  shippingInfo: string | null;
  createdAt: Date;
};

export type TaskWithRelations = StoredTask & {
  events: StoredTaskEvent[];
  sampleResults: StoredSampleResult[];
};

export interface SupplyChainStore {
  createTask(input: {
    id: string;
    title: string;
    description: string;
    productCategory: string;
    productName?: string;
    quantity?: number;
    material?: string;
    dimensions?: string;
    process?: string;
    colorRequirements?: string;
    packagingRequirements?: string;
    artworkRequirements?: string;
    budgetRange?: string;
    targetMarket?: string;
    assetUrls?: string[];
    deadline?: string;
    shippingDestination?: string;
    notes?: string;
    status: TaskStatus;
    initialAssessment: InitialAssessment;
  }): Promise<StoredTask>;
  listTasks(): Promise<StoredTask[]>;
  getTask(id: string): Promise<TaskWithRelations | null>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<StoredTask>;
  updateQuoteRequest(
    id: string,
    quoteRequest: { language: "en" | "zh"; text: string; supplier_checklist: string[] },
  ): Promise<StoredTask>;
  updateOrderWorkflow(
    id: string,
    input: {
      status?: TaskStatus;
      orderDraft?: unknown;
      userConfirmation?: unknown;
      productionRequest?: unknown;
      productionFeedback?: unknown;
      paymentIntent?: unknown;
      fulfillment?: unknown;
    },
  ): Promise<StoredTask>;
  createEvent(input: {
    id: string;
    taskId: string;
    type: string;
    message?: string;
    metadata?: unknown;
  }): Promise<StoredTaskEvent>;
  createSampleResult(input: {
    id: string;
    taskId: string;
    sampleImages?: string[];
    sampleVideos?: string[];
    quotedPrice?: string;
    productionTime?: string;
    supplierFeedback?: string;
    qualityNotes?: string;
    shippingInfo?: string;
  }): Promise<StoredSampleResult>;
}

export function createPrismaSupplyChainStore(prisma: any): SupplyChainStore {
  return {
    createTask: (input) =>
      prisma.supplyChainTask.create({
        data: {
          id: input.id,
          title: input.title,
          description: input.description,
          productCategory: input.productCategory,
          productName: input.productName,
          quantity: input.quantity,
          material: input.material,
          dimensions: input.dimensions,
          process: input.process,
          colorRequirements: input.colorRequirements,
          packagingRequirements: input.packagingRequirements,
          artworkRequirements: input.artworkRequirements,
          budgetRange: input.budgetRange,
          targetMarket: input.targetMarket,
          assetUrls: input.assetUrls,
          deadline: input.deadline,
          shippingDestination: input.shippingDestination,
          notes: input.notes,
          status: input.status,
          initialAssessment: input.initialAssessment,
        },
      }),
    listTasks: () =>
      prisma.supplyChainTask.findMany({
        orderBy: { updatedAt: "desc" },
      }),
    getTask: (id) =>
      prisma.supplyChainTask.findUnique({
        where: { id },
        include: {
          events: { orderBy: { createdAt: "asc" } },
          sampleResults: { orderBy: { createdAt: "desc" } },
        },
      }),
    updateTaskStatus: (id, status) =>
      prisma.supplyChainTask.update({
        where: { id },
        data: { status },
      }),
    updateQuoteRequest: (id, quoteRequest) =>
      prisma.supplyChainTask.update({
        where: { id },
        data: { quoteRequest },
      }),
    updateOrderWorkflow: (id, input) =>
      prisma.supplyChainTask.update({
        where: { id },
        data: {
          status: input.status,
          orderDraft: input.orderDraft,
          userConfirmation: input.userConfirmation,
          productionRequest: input.productionRequest,
          productionFeedback: input.productionFeedback,
          paymentIntent: input.paymentIntent,
          fulfillment: input.fulfillment,
        },
      }),
    createEvent: (input) =>
      prisma.taskEvent.create({
        data: {
          id: input.id,
          taskId: input.taskId,
          type: input.type,
          message: input.message,
          metadata: input.metadata,
        },
      }),
    createSampleResult: (input) =>
      prisma.sampleResult.create({
        data: {
          id: input.id,
          taskId: input.taskId,
          sampleImages: input.sampleImages,
          sampleVideos: input.sampleVideos,
          quotedPrice: input.quotedPrice,
          productionTime: input.productionTime,
          supplierFeedback: input.supplierFeedback,
          qualityNotes: input.qualityNotes,
          shippingInfo: input.shippingInfo,
        },
      }),
  };
}
