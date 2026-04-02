"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatYen, formatDate, getCurrentYearMonth } from "@/lib/format";
import { MonthSelector } from "@/components/layout/month-selector";
import { EditTransactionDialog } from "@/components/expense/edit-transaction-dialog";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";

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
  category: { name: string } | null;
}

export default function ExpensesPage() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // 編集
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // フォーム
  const [txType, setTxType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [memo, setMemo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?yearMonth=${yearMonth}`),
      fetch("/api/categories"),
    ]);
    const [txJson, catJson] = await Promise.all([txRes.json(), catRes.json()]);
    if (txJson.success) setTransactions(txJson.data);
    if (catJson.success) setCategories(catJson.data);
    setLoading(false);
  }, [yearMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetForm() {
    setAmount("");
    setTxDate(new Date().toISOString().slice(0, 10));
    setCategoryId("");
    setMerchantName("");
    setMemo("");
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
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
      toast.success("登録しました");
      resetForm();
      fetchData();
    } else {
      toast.error(json.error || "登録に失敗しました");
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("削除しました");
      fetchData();
    }
  }

  const filteredCategories = categories.filter((c) => c.type === txType);

  const transactionForm = (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">新規登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
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
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>日付</Label>
            <Input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
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
              placeholder="例: コンビニ"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>メモ</Label>
            <Input
              placeholder="任意"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            登録
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const transactionList = (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          この月の取引データはありません
        </p>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {tx.merchantName || "不明"}
                </span>
                {tx.memo && (
                  <span className="text-xs text-muted-foreground truncate">
                    {tx.memo}
                  </span>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(tx.txDate)}</span>
                  {tx.category && (
                    <span className="rounded bg-secondary px-1.5 py-0.5">
                      {tx.category.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    tx.txType === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tx.txType === "income" ? "+" : "-"}
                  {formatYen(tx.amount)}
                </span>
                <button
                  onClick={() => setEditingTx(tx)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="p-1 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">支出・収入</h1>
        {/* スマホのみ追加ボタン表示 */}
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm(!showForm)}
          className="md:hidden"
        >
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? "閉じる" : "追加"}
        </Button>
      </div>

      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      {/* PC: 左フォーム + 右リスト / スマホ: 縦並び */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        {/* PC: フォーム常時表示 / スマホ: トグル */}
        <div className={`${showForm ? "block" : "hidden"} md:block`}>
          {transactionForm}
        </div>
        <div>{transactionList}</div>
      </div>

      {editingTx && (
        <EditTransactionDialog
          transaction={editingTx}
          categories={categories}
          open={!!editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
