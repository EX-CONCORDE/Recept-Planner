"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/format";
import { toast } from "sonner";
import { Target, Plus, Trash2, PiggyBank, TrendingUp } from "lucide-react";

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  isActive: boolean;
}

interface MonthlyHistory {
  yearMonth: string;
  savingTarget: number;
  remaining: number;
  saved: number;
  cumulativeSaved: number;
}

interface SavingsData {
  goals: SavingsGoal[];
  monthlyHistory: MonthlyHistory[];
  totalSaved: number;
}

export function SavingsTracker() {
  const [data, setData] = useState<SavingsData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/savings-goals");
    const json = await res.json();
    if (json.success) setData(json.data);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/savings-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        targetAmount: Number(newTarget),
        currentAmount: Number(newCurrent) || 0,
        deadline: newDeadline || null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("目標を追加しました");
      setNewName("");
      setNewTarget("");
      setNewCurrent("");
      setNewDeadline("");
      setShowAdd(false);
      fetchData();
    } else {
      toast.error(json.error);
    }
  }

  async function handleUpdateCurrent(id: number, currentAmount: number) {
    await fetch(`/api/savings-goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount }),
    });
    fetchData();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
    toast.success("削除しました");
    fetchData();
  }

  if (!data) return null;

  const activeGoals = data.goals.filter((g) => g.isActive);

  return (
    <div className="space-y-4">
      {/* 歴代貯金サマリー */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            貯金累計
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {formatYen(data.totalSaved)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.monthlyHistory.length}ヶ月間の累計
            </p>
          </div>

          {/* 直近の月別貯金額 */}
          {data.monthlyHistory.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">月別実績</p>
              {data.monthlyHistory
                .slice(-6)
                .reverse()
                .map((m) => (
                  <div key={m.yearMonth} className="text-xs">
                    <div className="flex justify-between">
                      <span>{m.yearMonth.replace("-", "年")}月</span>
                      <span
                        className={
                          m.saved >= 0
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {m.saved >= 0 ? "+" : ""}
                        {formatYen(m.saved)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-[10px] ml-2">
                      <span>
                        目標 {formatYen(m.savingTarget)}
                        {m.remaining >= 0
                          ? ` + 残額 ${formatYen(m.remaining)}`
                          : ` - 超過 ${formatYen(Math.abs(m.remaining))}`}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 貯金目標 */}
      {activeGoals.map((goal) => {
        const progress = goal.targetAmount > 0
          ? Math.min(
              Math.round(
                ((goal.currentAmount + data.totalSaved) / goal.targetAmount) *
                  1000,
              ) / 10,
              100,
            )
          : 0;
        const totalForGoal = goal.currentAmount + data.totalSaved;
        const remaining = goal.targetAmount - totalForGoal;

        // 達成予測
        const avgMonthlySaving =
          data.monthlyHistory.length > 0
            ? data.totalSaved / data.monthlyHistory.length
            : 0;
        const monthsToGoal =
          avgMonthlySaving > 0 && remaining > 0
            ? Math.ceil(remaining / avgMonthlySaving)
            : null;

        const progressColor =
          progress >= 100
            ? "bg-green-500"
            : progress >= 60
              ? "bg-blue-500"
              : "bg-amber-500";

        return (
          <Card key={goal.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {goal.name}
                </span>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-1 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* プログレスバー */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{formatYen(totalForGoal)}</span>
                  <span className="font-semibold">{progress}%</span>
                  <span>{formatYen(goal.targetAmount)}</span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {progress < 100 ? (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    あと <span className="font-semibold">{formatYen(remaining)}</span>
                  </p>
                  {monthsToGoal && (
                    <p className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      今のペースで約
                      <span className="font-semibold">{monthsToGoal}ヶ月</span>
                      で達成見込み
                    </p>
                  )}
                  {goal.deadline && (
                    <p>期限: {goal.deadline.replace("-", "年")}月</p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-green-600 text-center">
                  🎉 目標達成！
                </p>
              )}

              {/* 現在額の手動調整 */}
              <div className="flex items-center gap-2 text-xs">
                <Label className="text-xs shrink-0">初期額:</Label>
                <Input
                  type="number"
                  className="h-7 text-xs"
                  defaultValue={goal.currentAmount}
                  onBlur={(e) =>
                    handleUpdateCurrent(goal.id, Number(e.target.value) || 0)
                  }
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* 目標追加 */}
      {showAdd ? (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">目標名</Label>
                <Input
                  placeholder="例: 旅行資金"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">目標額（円）</Label>
                <Input
                  type="number"
                  placeholder="例: 1000000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">既存の貯金額（円）</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCurrent}
                  onChange={(e) => setNewCurrent(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">期限（任意）</Label>
                <Input
                  type="month"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowAdd(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" size="sm" className="flex-1">
                  追加
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" />
          貯金目標を追加
        </Button>
      )}
    </div>
  );
}
