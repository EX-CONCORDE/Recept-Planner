-- =============================================
-- Multi-user migration
-- =============================================

-- 1. Create auth tables
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- 2. Create initial admin user
INSERT INTO "users" ("name", "email", "role", "created_at", "updated_at")
VALUES ('管理者', 'admin@local', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Add user_id columns (nullable first)
ALTER TABLE "categories" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "transactions" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "receipts" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "monthly_plans" ADD COLUMN "user_id" INTEGER;
ALTER TABLE "savings_goals" ADD COLUMN "user_id" INTEGER;

-- 4. Assign existing data to initial admin
UPDATE "categories" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@local');
UPDATE "transactions" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@local');
UPDATE "receipts" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@local');
UPDATE "monthly_plans" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@local');
UPDATE "savings_goals" SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@local');

-- 5. Make user_id NOT NULL
ALTER TABLE "categories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "receipts" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "monthly_plans" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "savings_goals" ALTER COLUMN "user_id" SET NOT NULL;

-- 6. Add foreign keys
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 7. Update unique constraints
-- categories: name -> (name, user_id)
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";
CREATE UNIQUE INDEX "categories_name_user_id_key" ON "categories"("name", "user_id");

-- monthly_plans: year_month -> (year_month, user_id)
ALTER TABLE "monthly_plans" DROP CONSTRAINT IF EXISTS "monthly_plans_year_month_key";
CREATE UNIQUE INDEX "monthly_plans_year_month_user_id_key" ON "monthly_plans"("year_month", "user_id");

-- 8. Add indexes
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
