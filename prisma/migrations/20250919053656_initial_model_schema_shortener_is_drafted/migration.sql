-- CreateTable
CREATE TABLE "public"."ShortenURL" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "shortenURL" TEXT NOT NULL,
    "originalURL" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortenURL_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortenURL_shortCode_key" ON "public"."ShortenURL"("shortCode");
