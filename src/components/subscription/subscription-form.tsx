"use client";

import { useState, useEffect } from "react";
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
}

interface SubscriptionData {
  id?: number;
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
  categoryId: number | null;
  memo: string | null;
  presetKey?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  initialData?: SubscriptionData | null;
}

export function SubscriptionForm({
  open,
  onClose,
  onSaved,
  categories,
  initialData,
}: SubscriptionFormProps) {
  const isEdit = !!initialData?.id;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [nextBillingDate, setNextBillingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(String(initialData.amount));
      setBillingCycle(initialData.billingCycle);
      setNextBillingDate(
        typeof initialData.nextBillingDate === "string"
          ? initialData.nextBillingDate.slice(0, 10)
          : new Date(initialData.nextBillingDate).toISOString().slice(0, 10),
      );
      setCategoryId(
        initialData.categoryId ? String(initialData.categoryId) : "",
      );
      setMemo(initialData.memo ?? "");
    } else {
      setName("");
      setAmount("");
      setBillingCycle("monthly");
      setNextBillingDate(new Date().toISOString().slice(0, 10));
      setCategoryId("");
      setMemo("");
    }
  }, [initialData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      name,
      amount: Number(amount),
      billingCycle,
      nextBillingDate,
      categoryId: categoryId ? Number(categoryId) : null,
      memo: memo || null,
      presetKey: initialData?.presetKey ?? null,
      icon: initialData?.icon ?? null,
      color: initialData?.color ?? null,
    };

    const url = isEdit
      ? `/api/subscriptions/${initialData.id}`
      : "/api/subscriptions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (json.success) {
      toast.success(isEdit ? "更新しました" : "登録しました");
      onSaved();
      onClose();
    } else {
      toast.error(json.error || "保存に失敗しました");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "サブスク編集" : "サブスク追加"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>サービス名</Label>
            <Input
              placeholder="例: Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>金額（円）</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={1}
            />
          </div>
          <div className="space-y-1">
            <Label>請求サイクル</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={billingCycle === "monthly" ? "default" : "outline"}
                onClick={() => setBillingCycle("monthly")}
              >
                月額
              </Button>
              <Button
                type="button"
                size="sm"
                variant={billingCycle === "yearly" ? "default" : "outline"}
                onClick={() => setBillingCycle("yearly")}
              >
                年額
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>次回請求日</Label>
            <Input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              required
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>メモ</Label>
            <Input
              placeholder="任意"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "保存中..." : isEdit ? "更新" : "登録"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
