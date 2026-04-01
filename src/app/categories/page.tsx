"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, Check, X, Lock } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: string;
  isDefault: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("expense");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    if (json.success) setCategories(json.data);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), type: newType }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("カテゴリを追加しました");
      setNewName("");
      fetchCategories();
    } else {
      toast.error(json.error || "追加に失敗しました");
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("削除しました");
      fetchCategories();
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  async function handleSaveEdit(id: number) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("更新しました");
      setEditingId(null);
      fetchCategories();
    } else {
      toast.error(json.error || "更新に失敗しました");
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function renderCategory(cat: Category) {
    const isEditing = editingId === cat.id;

    return (
      <div
        key={cat.id}
        className="flex items-center justify-between rounded-lg border p-3"
      >
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit(cat.id);
                if (e.key === "Escape") setEditingId(null);
              }}
            />
            <button
              onClick={() => handleSaveEdit(cat.id)}
              className="p-1 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm">{cat.name}</span>
              {cat.isDefault && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEdit(cat)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!cat.isDefault && (
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">カテゴリ管理</h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="新しいカテゴリ名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <select
              className="rounded-md border px-2 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          支出カテゴリ ({expenseCategories.length})
        </h2>
        <div className="space-y-1">
          {expenseCategories.map(renderCategory)}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          収入カテゴリ ({incomeCategories.length})
        </h2>
        <div className="space-y-1">
          {incomeCategories.map(renderCategory)}
        </div>
      </div>
    </div>
  );
}
