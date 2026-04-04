"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatYen, formatDate } from "@/lib/format";
import { SubscriptionForm } from "@/components/subscription/subscription-form";
import { PresetPicker } from "@/components/subscription/preset-picker";
import { toast } from "sonner";
import type { SubscriptionPreset } from "@/lib/subscription-presets";
import {
  Plus,
  Pencil,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  ListPlus,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Subscription {
  id: number;
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
  isActive: boolean;
  presetKey: string | null;
  icon: string | null;
  color: string | null;
  memo: string | null;
  categoryId: number | null;
  category: { name: string } | null;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [presetData, setPresetData] = useState<{
    name: string;
    amount: number;
    billingCycle: string;
    presetKey: string;
    icon: string;
    color: string;
    categoryHint: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subRes, catRes] = await Promise.all([
      fetch("/api/subscriptions"),
      fetch("/api/categories"),
    ]);
    const [subJson, catJson] = await Promise.all([
      subRes.json(),
      catRes.json(),
    ]);
    if (subJson.success) setSubscriptions(subJson.data);
    if (catJson.success) setCategories(catJson.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const inactiveSubs = subscriptions.filter((s) => !s.isActive);

  const monthlyTotal = activeSubs.reduce((sum, sub) => {
    return (
      sum +
      (sub.billingCycle === "yearly"
        ? Math.round(sub.amount / 12)
        : sub.amount)
    );
  }, 0);

  const yearlyTotal = activeSubs.reduce((sum, sub) => {
    return (
      sum +
      (sub.billingCycle === "yearly"
        ? sub.amount
        : sub.amount * 12)
    );
  }, 0);

  const registeredKeys = new Set(
    subscriptions
      .filter((s) => s.presetKey)
      .map((s) => s.presetKey as string),
  );

  async function handleToggleActive(sub: Subscription) {
    const res = await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !sub.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(sub.isActive ? "停止しました" : "再開しま���た");
      fetchData();
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      toast.success("停止しました");
      fetchData();
    }
  }

  function handlePresetSelect(preset: SubscriptionPreset) {
    const matchingCategory = categories.find(
      (c) => c.name === preset.categoryHint,
    );
    setPresetData({
      name: preset.name,
      amount: preset.amount,
      billingCycle: preset.billingCycle,
      presetKey: preset.key,
      icon: preset.icon,
      color: preset.color,
      categoryHint: preset.categoryHint,
    });
    setEditingSub(null);
    setShowForm(true);
  }

  function getInitialData() {
    if (editingSub) {
      return {
        id: editingSub.id,
        name: editingSub.name,
        amount: editingSub.amount,
        billingCycle: editingSub.billingCycle,
        nextBillingDate: editingSub.nextBillingDate,
        categoryId: editingSub.categoryId,
        memo: editingSub.memo,
        presetKey: editingSub.presetKey,
        icon: editingSub.icon,
        color: editingSub.color,
      };
    }
    if (presetData) {
      const matchingCategory = categories.find(
        (c) => c.name === presetData.categoryHint,
      );
      return {
        name: presetData.name,
        amount: presetData.amount,
        billingCycle: presetData.billingCycle,
        nextBillingDate: new Date().toISOString().slice(0, 10),
        categoryId: matchingCategory?.id ?? null,
        memo: null,
        presetKey: presetData.presetKey,
        icon: presetData.icon,
        color: presetData.color,
      };
    }
    return null;
  }

  function renderSubscriptionCard(sub: Subscription) {
    return (
      <div
        key={sub.id}
        className="flex items-center justify-between rounded-lg border p-3"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {sub.color && (
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: sub.color }}
            />
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium truncate">{sub.name}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatYen(sub.amount)}/{sub.billingCycle === "yearly" ? "年" : "月"}
              </span>
              {sub.category && (
                <span className="rounded bg-secondary px-1.5 py-0.5">
                  {sub.category.name}
                </span>
              )}
              {sub.isActive && (
                <span>次回: {formatDate(sub.nextBillingDate)}</span>
              )}
            </div>
            {sub.memo && (
              <span className="text-xs text-muted-foreground truncate">
                {sub.memo}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setEditingSub(sub);
              setPresetData(null);
              setShowForm(true);
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            title="編集"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleToggleActive(sub)}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            title={sub.isActive ? "停止" : "再開"}
          >
            {sub.isActive ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          サブスク管理
        </h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowPresets(true)}>
            <ListPlus className="h-4 w-4 mr-1" />
            プリセット
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingSub(null);
              setPresetData(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
      </div>

      {/* 合計カード */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">月額換算</p>
            <p className="text-xl font-bold">{formatYen(monthlyTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">年間合計</p>
            <p className="text-xl font-bold">{formatYen(yearlyTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              アクティブ ({activeSubs.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              停止中 ({inactiveSubs.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            {activeSubs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                アクティブなサブスクはありません
              </p>
            ) : (
              <div className="space-y-2">
                {activeSubs.map(renderSubscriptionCard)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="inactive">
            {inactiveSubs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                停止中のサブスクはありません
              </p>
            ) : (
              <div className="space-y-2">
                {inactiveSubs.map(renderSubscriptionCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <SubscriptionForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSub(null);
          setPresetData(null);
        }}
        onSaved={fetchData}
        categories={categories}
        initialData={getInitialData()}
      />

      <PresetPicker
        open={showPresets}
        onClose={() => setShowPresets(false)}
        onSelect={handlePresetSelect}
        registeredKeys={registeredKeys}
      />
    </div>
  );
}
