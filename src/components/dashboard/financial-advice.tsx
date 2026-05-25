"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bot, Loader2, Sparkles } from "lucide-react";

interface Advice {
  id: number;
  yearMonth: string;
  content: string;
  createdAt: string;
}

interface FinancialAdviceProps {
  yearMonth: string;
}

export function FinancialAdvice({ yearMonth }: FinancialAdviceProps) {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadAdvice() {
      setLoading(true);
      const res = await fetch(`/api/assistant/advice?yearMonth=${yearMonth}`);
      const json = await res.json();
      if (json.success) {
        setAdvice(json.data);
      } else {
        setAdvice(null);
      }
      setLoading(false);
    }
    loadAdvice();
  }, [yearMonth]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/assistant/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yearMonth }),
    });
    const json = await res.json();
    if (json.success) {
      setAdvice(json.data);
      toast.success("アドバイスを作成しました");
    } else {
      toast.error(json.error || "作成に失敗しました");
    }
    setGenerating(false);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {yearMonth.replace("-", "年")}月のアドバイス
          </CardTitle>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            作成
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : advice ? (
          <div className="space-y-2">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {advice.content}
            </div>
            <p className="text-[10px] text-muted-foreground">
              作成日: {new Date(advice.createdAt).toLocaleString("ja-JP")}
            </p>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            まだアドバイスはありません
          </p>
        )}
      </CardContent>
    </Card>
  );
}
