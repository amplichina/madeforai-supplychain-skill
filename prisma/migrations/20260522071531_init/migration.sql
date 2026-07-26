-- CreateTable
CREATE TABLE "SupplyChainTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "productName" TEXT,
    "quantity" INTEGER,
    "material" TEXT,
    "dimensions" TEXT,
    "process" TEXT,
    "colorRequirements" TEXT,
    "packagingRequirements" TEXT,
    "artworkRequirements" TEXT,
    "budgetRange" TEXT,
    "targetMarket" TEXT,
    "assetUrls" JSONB,
    "deadline" TEXT,
    "shippingDestination" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "initialAssessment" JSONB NOT NULL,
    "quoteRequest" JSONB,
    "orderDraft" JSONB,
    "userConfirmation" JSONB,
    "productionRequest" JSONB,
    "productionFeedback" JSONB,
    "paymentIntent" JSONB,
    "fulfillment" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyChainTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleResult" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "sampleImages" JSONB,
    "sampleVideos" JSONB,
    "quotedPrice" TEXT,
    "productionTime" TEXT,
    "supplierFeedback" TEXT,
    "qualityNotes" TEXT,
    "shippingInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplyChainTask_status_idx" ON "SupplyChainTask"("status");

-- CreateIndex
CREATE INDEX "SupplyChainTask_productCategory_idx" ON "SupplyChainTask"("productCategory");

-- CreateIndex
CREATE INDEX "TaskEvent_taskId_idx" ON "TaskEvent"("taskId");

-- CreateIndex
CREATE INDEX "TaskEvent_type_idx" ON "TaskEvent"("type");

-- CreateIndex
CREATE INDEX "SampleResult_taskId_idx" ON "SampleResult"("taskId");

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SupplyChainTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleResult" ADD CONSTRAINT "SampleResult_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "SupplyChainTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
