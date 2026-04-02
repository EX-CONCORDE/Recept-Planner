-- CreateTable
CREATE TABLE "savings_goals" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "target_amount" INTEGER NOT NULL,
    "current_amount" INTEGER NOT NULL DEFAULT 0,
    "deadline" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);
