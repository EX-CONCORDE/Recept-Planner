"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Transaction {
  id: number;
  txType: string;
  amount: number;
  txDate: string;
  merchantName: string | null;
  memo: string | null;
  categoryId: number | null;
}

interface EditTransactionDialogProps {
  transaction: Transaction;
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTransactionDialog({
  transaction,
  categories,
  open,
  onClose,
  onSaved,
}: EditTransactionDialogProps) {
  const [txType, setTxType] = useState(transaction.txType);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [txDate, setTxDate] = useState(
    transaction.txDate.slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState(
    transaction.categoryId ? String(transaction.categoryId) : "",
  );
  const [merchantName, setMerchantName] = useState(
    transaction.merchantName ?? "",
  );
  const [memo, setMemo] = useState(transaction.memo ?? "");
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === txType);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
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
      toast.success("更新しました");
      onSaved();
      onClose();
    } else {
      toast.error(json.error || "更新に失敗しました");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
