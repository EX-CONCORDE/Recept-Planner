"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYen } from "@/lib/format";

interface TaxBreakdownData {
  grossMonthly: number;
  standardMonthly: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  nursingCare: number;
  childcareSupport: number;
  socialInsuranceTotal: number;
  incomeTax: number;
  residentTax: number;
  taxTotal: number;
  totalDeductions: number;
  netMonthly: number;
  netRate: number;
}

interface TaxBreakdownProps {
  data: TaxBreakdownData;
}

export function TaxBreakdownCard({ data }: TaxBreakdownProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">税金・社会保険料の内訳</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* 社会保険料 */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1">
            社会保険料（月額・本人負担）
          </p>
          <div className="space-y-0.5 ml-2">
            <Row label="健康保険" value={data.healthInsurance} />
            <Row label="厚生年金" value={data.pension} />
            <Row label="雇用保険" value={data.employmentInsurance} />
            {data.nursingCare > 0 && (
              <Row label="介護保険" value={data.nursingCare} />
            )}
            <Row label="子育て支援金" value={data.childcareSupport} tag="2026新設" />
            <div className="border-t pt-0.5 font-semibold flex justify-between">
              <span>小計</span>
              <span className="text-red-600">
                -{formatYen(data.socialInsuranceTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* 税金 */}
        <div>
          <p className="font-semibold text-muted-foreground mb-1">
            税金（月額概算）
          </p>
          <div className="space-y-0.5 ml-2">
            <Row label="所得税" value={data.incomeTax} />
            <Row label="住民税" value={data.residentTax} note="前年所得ベース" />
            <div className="border-t pt-0.5 font-semibold flex justify-between">
              <span>小計</span>
              <span className="text-red-600">-{formatYen(data.taxTotal)}</span>
            </div>
          </div>
        </div>

        {/* サマリー */}
        <div className="rounded-lg bg-secondary p-3 space-y-1">
          <div className="flex justify-between">
            <span>額面月収</span>
            <span className="font-semibold">{formatYen(data.grossMonthly)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>控除合計</span>
            <span className="font-semibold">
              -{formatYen(data.totalDeductions)}
            </span>
          </div>
          <div className="border-t pt-1 flex justify-between text-base">
            <span className="font-bold">手取り</span>
            <span className="font-bold text-green-600">
              {formatYen(data.netMonthly)}
              <span className="text-xs text-muted-foreground ml-1">
                ({data.netRate}%)
              </span>
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          ※ 2026年度税率に基づく概算です。実際の額とは異なる場合があります。
        </p>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  note,
  tag,
}: {
  label: string;
  value: number;
  note?: string;
  tag?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-1">
        {label}
        {tag && (
          <span className="text-[10px] rounded bg-blue-100 text-blue-700 px-1 dark:bg-blue-900 dark:text-blue-300">
            {tag}
          </span>
        )}
        {note && (
          <span className="text-[10px] text-muted-foreground">({note})</span>
        )}
      </span>
      <span className="text-red-600">-{formatYen(value)}</span>
    </div>
  );
}
