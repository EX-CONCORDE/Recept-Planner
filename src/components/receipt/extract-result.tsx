"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, RotateCcw } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Extraction {
  store: string | null;
  date: string | null;
  total: number;
  tax: number | null;
  category: string;
  txType: "expense" | "income";
  items: Array<{ name: string; price: number }>;
  memo: string | null;
}

interface ExtractResultProps {
  receiptId: number;
  extraction: Extraction;
  categories: Category[];
  onConfirmed: () => void;
  onRetry: () => void;
}

export function ExtractResult({
  receiptId,
  extraction,
  categories,
  onConfirmed,
  onRetry,
}: ExtractResultProps) {
  const [txType, setTxType] = useState(extraction.txType);
  const [amount, setAmount] = useState(String(extraction.total));
  const [txDate, setTxDate] = useState(
    extraction.date || new Date().toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState("");
  const [merchantName, setMerchantName] = useState(extraction.store || "");
  const [memo, setMemo] = useState(extraction.memo || "");
  const [saving, setSaving] = useState(false);

  // AI提案カテゴリに一致するIDをセット
  useEffect(() => {
    const match = categories.find((c) => c.name === extraction.category);
    if (match) setCategoryId(String(match.id));
  }, [categories, extraction.category]);

  const filteredCategories = categories.filter((c) => c.type === txType);

  async function handleConfirm() {
    setSaving(true);
    const res = await fetch(`/api/receipts/${receiptId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txType,
        amount: Number(amount),
        txDate,
        categoryId: categoryId ? Number(categoryId) : null,
        merchantName: merchantName || null,
        memo: memo || null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("支出を登録しました");
      onConfirmed();
    } else {
      toast.error(json.error || "登録に失敗しました");
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>抽出結果を確認</span>
          <Button variant="ghost" size="sm" onClick={onRetry} className="gap-1">
            <RotateCcw className="h-4 w-4" />
            再抽出
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {extraction.items.length > 0 && (
          <div className="rounded bg-secondary p-2 text-xs space-y-0.5">
            <p className="font-medium mb-1">明細:</p>
            {extraction.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span>¥{item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={txType === "expense" ? "default" : "outline"}
            onClick={() => setTxType("expense")}
          >
            支出
          </Button>
          <Button
            type="button"
            size="sm"
            variant={txType === "income" ? "default" : "outline"}
            onClick={() => setTxType("income")}
          >
            収入
          </Button>
        </div>

        <div className="space-y-1">
          <Label>金額</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>日付</Label>
          <Input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>カテゴリ</Label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">未分類</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label>店名・請求元</Label>
          <Input
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>メモ</Label>
          <Input value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>

        <Button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full gap-2"
        >
          <Check className="h-4 w-4" />
          {saving ? "保存中..." : "この内容で登録"}
        </Button>
      </CardContent>
    </Card>
  );
}
