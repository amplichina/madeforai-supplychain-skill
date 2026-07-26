import type { TaskStatus } from "../domain/taskStatus.js";
import type {
  StoredSampleResult,
  StoredTask,
  StoredTaskEvent,
  SupplyChainStore,
  TaskWithRelations,
} from "../tools/store.js";

export function createInMemorySupplyChainStore(): SupplyChainStore {
  const tasks = new Map<string, StoredTask>();
  const events: StoredTaskEvent[] = [];
  const sampleResults: StoredSampleResult[] = [];

  const now = () => new Date();

  return {
    async createTask(input) {
      const date = now();
      const task: StoredTask = {
        id: input.id,
        title: input.title,
        description: input.description,
        productCategory: input.productCategory,
        productName: input.productName ?? null,
        quantity: input.quantity ?? null,
        material: input.material ?? null,
        dimensions: input.dimensions ?? null,
        process: input.process ?? null,
        colorRequirements: input.colorRequirements ?? null,
        packagingRequirements: input.packagingRequirements ?? null,
        artworkRequirements: input.artworkRequirements ?? null,
        budgetRange: input.budgetRange ?? null,
        targetMarket: input.targetMarket ?? null,
        assetUrls: input.assetUrls ?? null,
        deadline: input.deadline ?? null,
        shippingDestination: input.shippingDestination ?? null,
        notes: input.notes ?? null,
        status: input.status,
        initialAssessment: input.initialAssessment,
        quoteRequest: null,
        orderDraft: null,
        userConfirmation: null,
        productionRequest: null,
        productionFeedback: null,
        paymentIntent: null,
        fulfillment: null,
        createdAt: date,
        updatedAt: date,
      };
      tasks.set(task.id, task);
      return task;
    },
    async listTasks() {
      return Array.from(tasks.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    },
    async getTask(id: string): Promise<TaskWithRelations | null> {
      const task = tasks.get(id);
      if (!task) return null;

      return {
        ...task,
        events: events.filter((event) => event.taskId === id),
        sampleResults: sampleResults
          .filter((result) => result.taskId === id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      };
    },
    async updateTaskStatus(id: string, status: TaskStatus) {
      const task = tasks.get(id);
      if (!task) throw new Error(`Task not found: ${id}`);

      const updated = { ...task, status, updatedAt: now() };
      tasks.set(id, updated);
      return updated;
    },
    async updateQuoteRequest(id, quoteRequest) {
      const task = tasks.get(id);
      if (!task) throw new Error(`Task not found: ${id}`);

      const updated = { ...task, quoteRequest, updatedAt: now() };
      tasks.set(id, updated);
      return updated;
    },
    async updateOrderWorkflow(id, input) {
      const task = tasks.get(id);
      if (!task) throw new Error(`Task not found: ${id}`);

      const updated = {
        ...task,
        status: input.status ?? task.status,
        orderDraft: input.orderDraft ?? task.orderDraft,
        userConfirmation: input.userConfirmation ?? task.userConfirmation,
        productionRequest: input.productionRequest ?? task.productionRequest,
        productionFeedback: input.productionFeedback ?? task.productionFeedback,
        paymentIntent: input.paymentIntent ?? task.paymentIntent,
        fulfillment: input.fulfillment ?? task.fulfillment,
        updatedAt: now(),
      };
      tasks.set(id, updated);
      return updated;
    },
    async createEvent(input) {
      const event: StoredTaskEvent = {
        id: input.id,
        taskId: input.taskId,
        type: input.type,
        message: input.message ?? null,
        metadata: input.metadata ?? null,
        createdAt: now(),
      };
      events.push(event);
      return event;
    },
    async createSampleResult(input) {
      const result: StoredSampleResult = {
        id: input.id,
        taskId: input.taskId,
        sampleImages: input.sampleImages ?? null,
        sampleVideos: input.sampleVideos ?? null,
        quotedPrice: input.quotedPrice ?? null,
        productionTime: input.productionTime ?? null,
        supplierFeedback: input.supplierFeedback ?? null,
        qualityNotes: input.qualityNotes ?? null,
        shippingInfo: input.shippingInfo ?? null,
        createdAt: now(),
      };
      sampleResults.push(result);
      return result;
    },
  };
}
