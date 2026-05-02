-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandResult" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL,
    "mentionCount" INTEGER NOT NULL DEFAULT 0,
    "firstMentionIndex" INTEGER,
    "sentimentScore" DOUBLE PRECISION,
    "sentimentLabel" TEXT,
    "scoringMethod" TEXT,

    CONSTRAINT "BrandResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAttribute" (
    "id" TEXT NOT NULL,
    "brandResultId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,

    CONSTRAINT "BrandAttribute_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BrandResult" ADD CONSTRAINT "BrandResult_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAttribute" ADD CONSTRAINT "BrandAttribute_brandResultId_fkey" FOREIGN KEY ("brandResultId") REFERENCES "BrandResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
