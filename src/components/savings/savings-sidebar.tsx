"use client";

import { useEffect, useState } from "react";
import { formatYen } from "@/lib/format";
import { PiggyBank, Target } from "lucide-react";

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  isActive: boolean;
}

interface SavingsData {
  goals: SavingsGoal[];
  totalSaved: number;
}

export function SavingsSidebar() {
  const [data, setData] = useState<SavingsData | null>(null);

  useEffect(() => {
    fetch("/api/savings-goals")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      });
  }, []);

  if (!data) return null;

  const activeGoals = data.goals.filter((g) => g.isActive);

  return (
    <div className="px-3 py-3 border-t space-y-3">
      {/* 累計貯金 */}
      <div className="flex items-center gap-2 px-2">
        <PiggyBank className="h-4 w-4 text-green-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">貯金累計</p>
          <p className="text-sm font-bold text-green-600 truncate">
            {formatYen(data.totalSaved)}
          </p>
        </div>
      </div>

      {/* 目標 */}
      {activeGoals.slice(0, 3).map((goal) => {
        const total = goal.currentAmount + data.totalSaved;
        const progress = goal.targetAmount > 0
          ? Math.min(Math.round((total / goal.targetAmount) * 100), 100)
          : 0;
        const progressColor =
          progress >= 100
            ? "bg-green-500"
            : progress >= 60
              ? "bg-blue-500"
              : "bg-amber-500";

        return (
          <div key={goal.id} className="px-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <Target className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate flex-1">
                {goal.name}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="font-medium">{progress}%</span>
              <span className="text-muted-foreground">
                {formatYen(goal.targetAmount)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
