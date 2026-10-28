-- CreateEnum
CREATE TYPE "Category" AS ENUM ('market_wrap', 'equity_analysis', 'news_brief', 'macro_radar');

-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('NGX', 'GSE', 'NSE');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('positive', 'neutral', 'negative');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('published', 'retracted');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "exchange" "Exchange",
    "tickers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excerpt" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "metrics" JSONB,
    "sentiment" "Sentiment",
    "status" "PostStatus" NOT NULL DEFAULT 'published',
    "correctionNote" TEXT,
    "clientRef" TEXT,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "asOf" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostRedirect" (
    "oldSlug" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostRedirect_pkey" PRIMARY KEY ("oldSlug")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_clientRef_key" ON "Post"("clientRef");

-- CreateIndex
CREATE INDEX "Post_status_publishedAt_idx" ON "Post"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Post_category_status_publishedAt_idx" ON "Post"("category", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Post_exchange_status_publishedAt_idx" ON "Post"("exchange", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Post_tickers_idx" ON "Post" USING GIN ("tickers");

-- CreateIndex
CREATE INDEX "Post_tags_idx" ON "Post" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "PostRedirect_postId_idx" ON "PostRedirect"("postId");

-- AddForeignKey
ALTER TABLE "PostRedirect" ADD CONSTRAINT "PostRedirect_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
