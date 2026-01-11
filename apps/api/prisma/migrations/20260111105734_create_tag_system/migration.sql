-- CreateTable
CREATE TABLE "tag_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "user_id" UUID,
    "color" VARCHAR(7),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_categories_slug_key" ON "tag_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_category_id_slug_key" ON "tags"("category_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_category_id_slug_user_id_key" ON "tags"("category_id", "slug", "user_id");

-- CreateIndex
CREATE INDEX "tags_category_id_idx" ON "tags"("category_id");

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_tags_recipe_id_tag_id_key" ON "recipe_tags"("recipe_id", "tag_id");

-- CreateIndex
CREATE INDEX "recipe_tags_recipe_id_idx" ON "recipe_tags"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_tags_tag_id_idx" ON "recipe_tags"("tag_id");

-- CreateIndex
CREATE INDEX "recipe_tags_recipe_id_tag_id_idx" ON "recipe_tags"("recipe_id", "tag_id");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tag_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
