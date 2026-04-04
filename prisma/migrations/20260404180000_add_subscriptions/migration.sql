-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "amount" INTEGER NOT NULL,
    "billing_cycle" VARCHAR(10) NOT NULL,
    "category_id" INTEGER,
    "next_billing_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "preset_key" VARCHAR(100),
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "memo" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add subscription fields to transactions
ALTER TABLE "transactions" ADD COLUMN "subscription_id" INTEGER;
ALTER TABLE "transactions" ADD COLUMN "billing_key" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_billing_key_key" ON "transactions"("billing_key");
CREATE INDEX "transactions_subscription_id_idx" ON "transactions"("subscription_id");
CREATE INDEX "subscriptions_next_billing_date_idx" ON "subscriptions"("next_billing_date");
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions"("is_active");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
