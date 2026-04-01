/**
 * 日本の税金・社会保険料 計算エンジン
 * 2026年度（令和8年度）4月1日時点の税率に基づく
 */

// ============================================================
// 社会保険料率（2026年度）
// ============================================================

/** 協会けんぽ 都道府県別健康保険料率（2026年度） 合計率 */
export const HEALTH_INSURANCE_RATES: Record<string, number> = {
  北海道: 10.29,
  青森: 9.88,
  岩手: 9.63,
  宮城: 10.01,
  秋田: 9.78,
  山形: 9.85,
  福島: 9.58,
  茨城: 9.74,
  栃木: 9.79,
  群馬: 9.77,
  埼玉: 9.78,
  千葉: 9.76,
  東京: 9.63,
  神奈川: 9.85,
  新潟: 9.35,
  富山: 9.57,
  石川: 9.78,
  福井: 9.89,
  山梨: 9.67,
  長野: 9.49,
  岐阜: 9.82,
  静岡: 9.64,
  愛知: 9.93,
  三重: 9.81,
  滋賀: 9.72,
  京都: 9.90,
  大阪: 10.22,
  兵庫: 10.07,
  奈良: 9.87,
  和歌山: 9.87,
  鳥取: 9.73,
  島根: 9.95,
  岡山: 10.07,
  広島: 9.92,
  山口: 10.03,
  徳島: 10.25,
  香川: 10.18,
  愛媛: 10.01,
  高知: 10.09,
  福岡: 10.21,
  佐賀: 10.42,
  長崎: 10.15,
  熊本: 10.02,
  大分: 10.11,
  宮崎: 9.76,
  鹿児島: 10.12,
  沖縄: 9.56,
  全国平均: 9.90,
};

/** 厚生年金保険料率（合計）— 2017年9月〜固定 */
const PENSION_RATE_TOTAL = 18.3;

/** 雇用保険料率（一般の事業・被保険者負担）2026年度 */
const EMPLOYMENT_INSURANCE_RATE_EMPLOYEE = 0.5;

/** 介護保険料率（合計）2026年度 — 40歳以上65歳未満 */
const NURSING_CARE_RATE_TOTAL = 1.62;

/** 子ども・子育て支援金率（合計）2026年度新設 */
const CHILDCARE_SUPPORT_RATE_TOTAL = 0.23;

// ============================================================
// 所得税テーブル（2026年分）
// ============================================================

/** 給与所得控除テーブル */
function calcSalaryDeduction(annualIncome: number): number {
  if (annualIncome <= 1_625_000) return 650_000; // 2025改正: 55万→65万
  if (annualIncome <= 1_800_000) return annualIncome * 0.4 - 100_000;
  if (annualIncome <= 3_600_000) return annualIncome * 0.3 + 80_000;
  if (annualIncome <= 6_600_000) return annualIncome * 0.2 + 440_000;
  if (annualIncome <= 8_500_000) return annualIncome * 0.1 + 1_100_000;
  return 1_950_000;
}

/**
 * 基礎控除（所得税）2026年分（令和8年分）— 特例あり
 * R7-R8年分は低所得層に追加上乗せ
 */
function calcBasicDeduction(totalIncome: number): number {
  if (totalIncome <= 1_320_000) return 950_000;
  if (totalIncome <= 3_360_000) return 880_000;
  if (totalIncome <= 4_890_000) return 680_000;
  if (totalIncome <= 6_550_000) return 630_000;
  if (totalIncome <= 23_500_000) return 580_000;
  if (totalIncome <= 24_000_000) return 480_000;
  if (totalIncome <= 24_500_000) return 320_000;
  if (totalIncome <= 25_000_000) return 160_000;
  return 0;
}

/** 住民税の基礎控除（2026年度も43万円で据え置き） */
const RESIDENT_TAX_BASIC_DEDUCTION = 430_000;

/** 所得税の累進税率テーブル */
const INCOME_TAX_BRACKETS: Array<{
  limit: number;
  rate: number;
  deduction: number;
}> = [
  { limit: 1_950_000, rate: 0.05, deduction: 0 },
  { limit: 3_300_000, rate: 0.1, deduction: 97_500 },
  { limit: 6_950_000, rate: 0.2, deduction: 427_500 },
  { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
  { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { limit: 40_000_000, rate: 0.4, deduction: 2_796_000 },
  { limit: Infinity, rate: 0.45, deduction: 4_796_000 },
];

/** 復興特別所得税率 (2037年まで) */
const RECONSTRUCTION_TAX_RATE = 0.021;

/** 住民税所得割 標準税率 */
const RESIDENT_TAX_INCOME_RATE_BASE = 0.1;

/** 住民税均等割 標準額（道府県1,000 + 市町村3,000）+ 森林環境税（国税）1,000 */
const RESIDENT_TAX_FLAT_BASE = 5_000;

/**
 * 都道府県別 住民税均等割の超過課税（年額）
 * 各都道府県独自の森林環境税・環境税等
 */
const RESIDENT_TAX_SURCHARGE: Record<string, number> = {
  北海道: 0, 青森: 0, 岩手: 1000, 宮城: 1200, 秋田: 800,
  山形: 1000, 福島: 1000, 茨城: 1000, 栃木: 700, 群馬: 700,
  埼玉: 0, 千葉: 0, 東京: 0, 神奈川: 300, 新潟: 0,
  富山: 500, 石川: 500, 福井: 0, 山梨: 500, 長野: 500,
  岐阜: 1000, 静岡: 400, 愛知: 500, 三重: 1000, 滋賀: 800,
  京都: 600, 大阪: 300, 兵庫: 800, 奈良: 500, 和歌山: 500,
  鳥取: 500, 島根: 500, 岡山: 500, 広島: 500, 山口: 500,
  徳島: 0, 香川: 0, 愛媛: 700, 高知: 500, 福岡: 500,
  佐賀: 500, 長崎: 500, 熊本: 500, 大分: 500, 宮崎: 500,
  鹿児島: 500, 沖縄: 0, 全国平均: 0,
};

/**
 * 都道府県別 住民税所得割の超過課税率
 * 神奈川県のみ水源環境保全税 +0.025%
 */
const RESIDENT_TAX_INCOME_SURCHARGE: Record<string, number> = {
  神奈川: 0.00025,
};

/** 都道府県別の均等割合計（標準 + 森林環境税 + 超過課税）を取得 */
function getResidentTaxFlat(prefecture: string): number {
  const surcharge = RESIDENT_TAX_SURCHARGE[prefecture] ?? 0;
  return RESIDENT_TAX_FLAT_BASE + 1_000 + surcharge; // 標準5,000 + 森林環境税1,000 + 超過課税
}

/** 都道府県別の所得割率を取得 */
function getResidentTaxIncomeRate(prefecture: string): number {
  const surcharge = RESIDENT_TAX_INCOME_SURCHARGE[prefecture] ?? 0;
  return RESIDENT_TAX_INCOME_RATE_BASE + surcharge;
}

// ============================================================
// 標準報酬月額テーブル（主要等級のみ、厚生年金の範囲）
// ============================================================

const STANDARD_MONTHLY_GRADES = [
  { grade: 1, standard: 88_000, lower: 0, upper: 93_000 },
  { grade: 2, standard: 98_000, lower: 93_000, upper: 101_000 },
  { grade: 3, standard: 104_000, lower: 101_000, upper: 107_000 },
  { grade: 4, standard: 110_000, lower: 107_000, upper: 114_000 },
  { grade: 5, standard: 118_000, lower: 114_000, upper: 122_000 },
  { grade: 6, standard: 126_000, lower: 122_000, upper: 130_000 },
  { grade: 7, standard: 134_000, lower: 130_000, upper: 138_000 },
  { grade: 8, standard: 142_000, lower: 138_000, upper: 146_000 },
  { grade: 9, standard: 150_000, lower: 146_000, upper: 155_000 },
  { grade: 10, standard: 160_000, lower: 155_000, upper: 165_000 },
  { grade: 11, standard: 170_000, lower: 165_000, upper: 175_000 },
  { grade: 12, standard: 180_000, lower: 175_000, upper: 185_000 },
  { grade: 13, standard: 190_000, lower: 185_000, upper: 195_000 },
  { grade: 14, standard: 200_000, lower: 195_000, upper: 210_000 },
  { grade: 15, standard: 220_000, lower: 210_000, upper: 230_000 },
  { grade: 16, standard: 240_000, lower: 230_000, upper: 250_000 },
  { grade: 17, standard: 260_000, lower: 250_000, upper: 270_000 },
  { grade: 18, standard: 280_000, lower: 270_000, upper: 290_000 },
  { grade: 19, standard: 300_000, lower: 290_000, upper: 310_000 },
  { grade: 20, standard: 320_000, lower: 310_000, upper: 330_000 },
  { grade: 21, standard: 340_000, lower: 330_000, upper: 350_000 },
  { grade: 22, standard: 360_000, lower: 350_000, upper: 370_000 },
  { grade: 23, standard: 380_000, lower: 370_000, upper: 395_000 },
  { grade: 24, standard: 410_000, lower: 395_000, upper: 425_000 },
  { grade: 25, standard: 440_000, lower: 425_000, upper: 455_000 },
  { grade: 26, standard: 470_000, lower: 455_000, upper: 485_000 },
  { grade: 27, standard: 500_000, lower: 485_000, upper: 515_000 },
  { grade: 28, standard: 530_000, lower: 515_000, upper: 545_000 },
  { grade: 29, standard: 560_000, lower: 545_000, upper: 575_000 },
  { grade: 30, standard: 590_000, lower: 575_000, upper: 605_000 },
  { grade: 31, standard: 620_000, lower: 605_000, upper: 635_000 },
  { grade: 32, standard: 650_000, lower: 635_000, upper: Infinity },
];

function getStandardMonthlyRemuneration(monthly: number): number {
  for (const g of STANDARD_MONTHLY_GRADES) {
    if (monthly < g.upper) return g.standard;
  }
  return 650_000;
}

// ============================================================
// 公開インターフェース
// ============================================================

export interface TaxConfig {
  /** 額面月収（円） */
  grossMonthly: number;
  /** 都道府県名（デフォルト: "全国平均"） */
  prefecture?: string;
  /** 年齢（40歳以上で介護保険適用） */
  age?: number;
  /** 賞与の月数（デフォルト: 0） */
  bonusMonths?: number;
}

export interface TaxBreakdown {
  /** 額面月収 */
  grossMonthly: number;
  /** 額面年収 */
  grossAnnual: number;
  /** 標準報酬月額 */
  standardMonthly: number;
  /** 都道府県 */
  prefecture: string;
  /** 住民税均等割の超過課税（年額） */
  residentTaxSurcharge: number;

  /** --- 社会保険料（月額・本人負担） --- */
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  nursingCare: number;
  childcareSupport: number;
  socialInsuranceTotal: number;

  /** --- 税金（月額概算） --- */
  incomeTax: number;
  residentTax: number;
  taxTotal: number;

  /** --- 合計控除・手取り --- */
  totalDeductions: number;
  netMonthly: number;
  netRate: number;

  /** --- 年額 --- */
  socialInsuranceAnnual: number;
  incomeTaxAnnual: number;
  residentTaxAnnual: number;
  totalDeductionsAnnual: number;
  netAnnual: number;
}

export function calculateTax(config: TaxConfig): TaxBreakdown {
  const {
    grossMonthly,
    prefecture = "全国平均",
    age = 30,
    bonusMonths = 0,
  } = config;

  const grossAnnual = grossMonthly * (12 + bonusMonths);
  const standardMonthly = getStandardMonthlyRemuneration(grossMonthly);

  // --- 社会保険料（月額・本人負担） ---
  const healthRate =
    (HEALTH_INSURANCE_RATES[prefecture] ?? HEALTH_INSURANCE_RATES["全国平均"]) /
    100;
  const healthInsurance = Math.round((standardMonthly * healthRate) / 2);
  const pension = Math.round(
    (standardMonthly * (PENSION_RATE_TOTAL / 100)) / 2,
  );
  const employmentInsurance = Math.round(
    grossMonthly * (EMPLOYMENT_INSURANCE_RATE_EMPLOYEE / 100),
  );
  const nursingCare =
    age >= 40
      ? Math.round((standardMonthly * (NURSING_CARE_RATE_TOTAL / 100)) / 2)
      : 0;
  const childcareSupport = Math.round(
    (standardMonthly * (CHILDCARE_SUPPORT_RATE_TOTAL / 100)) / 2,
  );

  const socialInsuranceTotal =
    healthInsurance +
    pension +
    employmentInsurance +
    nursingCare +
    childcareSupport;
  const socialInsuranceAnnual = socialInsuranceTotal * 12;

  // --- 所得税（年額→月額） ---
  const salaryDeduction = calcSalaryDeduction(grossAnnual);
  const salaryIncome = Math.max(grossAnnual - salaryDeduction, 0);
  const basicDeduction = calcBasicDeduction(salaryIncome);
  const taxableIncome = Math.max(
    Math.floor((salaryIncome - basicDeduction - socialInsuranceAnnual) / 1000) *
      1000,
    0,
  );

  let incomeTaxAnnual = 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      incomeTaxAnnual = taxableIncome * bracket.rate - bracket.deduction;
      break;
    }
  }
  // 復興特別所得税
  incomeTaxAnnual = Math.floor(
    incomeTaxAnnual * (1 + RECONSTRUCTION_TAX_RATE),
  );
  incomeTaxAnnual = Math.max(incomeTaxAnnual, 0);
  const incomeTax = Math.round(incomeTaxAnnual / 12);

  // --- 住民税（年額→月額）--- 都道府県別の超過課税を適用
  const residentTaxableIncome = Math.max(
    Math.floor(
      (salaryIncome - RESIDENT_TAX_BASIC_DEDUCTION - socialInsuranceAnnual) /
        1000,
    ) * 1000,
    0,
  );
  const residentTaxRate = getResidentTaxIncomeRate(prefecture);
  const residentIncomeRate = Math.floor(
    residentTaxableIncome * residentTaxRate,
  );
  // 調整控除（基礎控除の差額5万円×5%=2,500円を概算適用）
  const adjustmentDeduction = 2500;
  const residentTaxFlat = getResidentTaxFlat(prefecture);
  const residentTaxAnnual = Math.max(
    residentIncomeRate - adjustmentDeduction + residentTaxFlat,
    0,
  );
  const residentTax = Math.round(residentTaxAnnual / 12);

  // --- 合計 ---
  const taxTotal = incomeTax + residentTax;
  const totalDeductions = socialInsuranceTotal + taxTotal;
  const netMonthly = grossMonthly - totalDeductions;
  const netRate =
    grossMonthly > 0
      ? Math.round((netMonthly / grossMonthly) * 1000) / 10
      : 0;

  const totalDeductionsAnnual =
    socialInsuranceAnnual + incomeTaxAnnual + residentTaxAnnual;
  const netAnnual = grossAnnual - totalDeductionsAnnual;

  return {
    grossMonthly,
    grossAnnual,
    standardMonthly,
    prefecture,
    residentTaxSurcharge: RESIDENT_TAX_SURCHARGE[prefecture] ?? 0,
    healthInsurance,
    pension,
    employmentInsurance,
    nursingCare,
    childcareSupport,
    socialInsuranceTotal,
    incomeTax,
    residentTax,
    taxTotal,
    totalDeductions,
    netMonthly,
    netRate,
    socialInsuranceAnnual,
    incomeTaxAnnual,
    residentTaxAnnual,
    totalDeductionsAnnual,
    netAnnual,
  };
}

/**
 * 住民税予測: 今年の年収データから来年の住民税を概算
 */
export function predictResidentTax(config: {
  estimatedAnnualIncome: number;
  estimatedAnnualSocialInsurance: number;
  prefecture?: string;
}): { annual: number; monthly: number } {
  const { estimatedAnnualIncome, estimatedAnnualSocialInsurance, prefecture = "全国平均" } = config;
  const salaryDeduction = calcSalaryDeduction(estimatedAnnualIncome);
  const salaryIncome = Math.max(estimatedAnnualIncome - salaryDeduction, 0);
  const taxableIncome = Math.max(
    Math.floor(
      (salaryIncome -
        RESIDENT_TAX_BASIC_DEDUCTION -
        estimatedAnnualSocialInsurance) /
        1000,
    ) * 1000,
    0,
  );
  const rate = getResidentTaxIncomeRate(prefecture);
  const flat = getResidentTaxFlat(prefecture);
  const incomeRate = Math.floor(taxableIncome * rate);
  const annual = Math.max(incomeRate - 2500 + flat, 0);
  return { annual, monthly: Math.round(annual / 12) };
}

/** 都道府県リスト */
export const PREFECTURES = Object.keys(HEALTH_INSURANCE_RATES);
