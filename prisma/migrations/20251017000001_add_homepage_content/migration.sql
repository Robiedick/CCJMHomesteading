-- CreateTable
CREATE TABLE "HomepageContent" (
    "id" SERIAL NOT NULL,
    "locale" TEXT NOT NULL,
    "navTagline" TEXT NOT NULL,
    "navLatestStoriesLabel" TEXT NOT NULL,
    "navSignInLabel" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "heroCtaPrimaryLabel" TEXT NOT NULL,
    "heroCtaSecondaryLabel" TEXT NOT NULL,
    "heroEditorTitle" TEXT NOT NULL,
    "heroEditorDescription" TEXT NOT NULL,
    "heroEditorLinkLabel" TEXT NOT NULL,
    "switcherLabel" TEXT NOT NULL,
    "switcherEnglishLabel" TEXT NOT NULL,
    "switcherDutchLabel" TEXT NOT NULL,
    "topicsTitle" TEXT NOT NULL,
    "topicsDescription" TEXT NOT NULL,
    "topicsEmpty" TEXT NOT NULL,
    "topicsCountSingular" TEXT NOT NULL,
    "topicsCountPlural" TEXT NOT NULL,
    "storiesTitle" TEXT NOT NULL,
    "storiesDescription" TEXT NOT NULL,
    "storiesEmpty" TEXT NOT NULL,
    "storiesCountLabel" TEXT NOT NULL,
    "storiesCountSingular" TEXT NOT NULL,
    "storiesCountPlural" TEXT NOT NULL,
    "storiesReadMore" TEXT NOT NULL,
    "storiesUncategorized" TEXT NOT NULL,
    "footerNote" TEXT NOT NULL,
    "footerSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageContent_locale_key" ON "HomepageContent"("locale");
