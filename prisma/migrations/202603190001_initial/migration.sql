-- CreateEnum
CREATE TYPE "RelationType" AS ENUM (
    'synonym',
    'antonym',
    'broader',
    'narrower',
    'associated',
    'categoryMember',
    'variant',
    'similar'
);

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('audio', 'image');

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "lemma" TEXT NOT NULL,
    "syllabics" TEXT,
    "slug" TEXT NOT NULL,
    "plainEnglish" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "linguisticClass" TEXT,
    "rootStem" TEXT,
    "pronunciation" TEXT,
    "audioUrl" TEXT,
    "beginnerExplanation" TEXT,
    "expertExplanation" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordMeaning" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "gloss" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WordMeaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorphologyTable" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPlainEnglish" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorphologyTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorphologyEntry" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "rowLabel" TEXT NOT NULL,
    "columnLabel" TEXT,
    "plainLabel" TEXT,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MorphologyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relation" (
    "id" TEXT NOT NULL,
    "fromWordId" TEXT NOT NULL,
    "toWordId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "label" TEXT,
    "isBidirectional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "colorToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordCategory" (
    "wordId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WordCategory_pkey" PRIMARY KEY ("wordId","categoryId")
);

-- CreateTable
CREATE TABLE "SavedWord" (
    "id" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_slug_key" ON "Word"("slug");

-- CreateIndex
CREATE INDEX "Word_lemma_idx" ON "Word"("lemma");

-- CreateIndex
CREATE INDEX "Word_plainEnglish_idx" ON "Word"("plainEnglish");

-- CreateIndex
CREATE INDEX "WordMeaning_wordId_sortOrder_idx" ON "WordMeaning"("wordId", "sortOrder");

-- CreateIndex
CREATE INDEX "MorphologyTable_wordId_sortOrder_idx" ON "MorphologyTable"("wordId", "sortOrder");

-- CreateIndex
CREATE INDEX "MorphologyEntry_tableId_sortOrder_idx" ON "MorphologyEntry"("tableId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Relation_fromWordId_toWordId_relationType_key" ON "Relation"("fromWordId", "toWordId", "relationType");

-- CreateIndex
CREATE INDEX "Relation_fromWordId_idx" ON "Relation"("fromWordId");

-- CreateIndex
CREATE INDEX "Relation_toWordId_idx" ON "Relation"("toWordId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "WordCategory_categoryId_sortOrder_idx" ON "WordCategory"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SavedWord_clientKey_wordId_key" ON "SavedWord"("clientKey", "wordId");

-- CreateIndex
CREATE INDEX "SavedWord_wordId_idx" ON "SavedWord"("wordId");

-- CreateIndex
CREATE INDEX "MediaAsset_wordId_idx" ON "MediaAsset"("wordId");

-- AddForeignKey
ALTER TABLE "WordMeaning"
ADD CONSTRAINT "WordMeaning_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorphologyTable"
ADD CONSTRAINT "MorphologyTable_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorphologyEntry"
ADD CONSTRAINT "MorphologyEntry_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "MorphologyTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relation"
ADD CONSTRAINT "Relation_fromWordId_fkey" FOREIGN KEY ("fromWordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relation"
ADD CONSTRAINT "Relation_toWordId_fkey" FOREIGN KEY ("toWordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordCategory"
ADD CONSTRAINT "WordCategory_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordCategory"
ADD CONSTRAINT "WordCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedWord"
ADD CONSTRAINT "SavedWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset"
ADD CONSTRAINT "MediaAsset_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
