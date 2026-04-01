-- AlterTable
ALTER TABLE "monthly_plans" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "auto_calc_tax" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bonus_months" DOUBLE PRECISION,
ADD COLUMN     "gross_income" INTEGER,
ADD COLUMN     "prefecture" VARCHAR(10);
