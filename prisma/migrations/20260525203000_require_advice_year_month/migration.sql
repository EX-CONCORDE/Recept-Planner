-- Backfill legacy rows that predate month-scoped advice.
UPDATE "financial_advice"
SET "year_month" = TO_CHAR("created_at", 'YYYY-MM')
WHERE "year_month" IS NULL;

-- Make advice month explicit and queryable by selected dashboard month.
ALTER TABLE "financial_advice"
ALTER COLUMN "year_month" SET NOT NULL;

CREATE INDEX "financial_advice_year_month_idx" ON "financial_advice"("year_month");
