"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCurrentYearMonth } from "@/lib/format";
import { toast } from "sonner";

export default function SettingsPage() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [savingTargetAmount, setSavingTargetAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/monthly-plans/${yearMonth}`);
      const json = await res.json();
      if (json.success) {
        setMonthlyIncome(String(json.data.monthlyIncome || ""));
        setSavingTargetAmount(String(json.data.savingTargetAmount || ""));
      }
    }
    load();
  }, [yearMonth]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/monthly-plans/${yearMonth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyIncome: Number(monthlyIncome) || 0,
        savingTargetAmount: Number(savingTargetAmount) || 0,
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("設定を保存しました");
    } else {
      toast.error(json.error || "保存に失敗しました");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">月次設定</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">対象月</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">収入・貯金目標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">月収（円）</Label>
            <Input
              id="income"
              type="number"
              placeholder="例: 300000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saving">貯金目標額（円）</Label>
            <Input
              id="saving"
              type="number"
              placeholder="例: 50000"
              value={savingTargetAmount}
              onChange={(e) => setSavingTargetAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "保存中..." : "保存"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
