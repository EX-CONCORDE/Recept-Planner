"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  yearMonth: string;
  onChange: (yearMonth: string) => void;
}

export function MonthSelector({ yearMonth, onChange }: MonthSelectorProps) {
  function handleChange(direction: -1 | 1) {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, "0");
    onChange(`${newYear}-${newMonth}`);
  }

  const displayLabel = yearMonth.replace("-", "年") + "月";

  return (
    <div className="flex items-center justify-between rounded-lg border px-2 py-1.5">
      <button
        onClick={() => handleChange(-1)}
        className="rounded p-1.5 hover:bg-secondary"
        aria-label="前月"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-base font-bold">{displayLabel}</span>
      <button
        onClick={() => handleChange(1)}
        className="rounded p-1.5 hover:bg-secondary"
        aria-label="翌月"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
