"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/format";
import {
  subscriptionPresets,
  groupPresetsByCategory,
  type SubscriptionPreset,
} from "@/lib/subscription-presets";

interface PresetPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (preset: SubscriptionPreset) => void;
  registeredKeys: Set<string>;
}

export function PresetPicker({
  open,
  onClose,
  onSelect,
  registeredKeys,
}: PresetPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? subscriptionPresets.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.categoryHint.includes(search),
      )
    : subscriptionPresets;

  const grouped = groupPresetsByCategory(filtered);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>プリセットから追加</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="サービス名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {Object.entries(grouped).map(([category, presets]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {category}
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {presets.map((preset) => {
                  const isRegistered = registeredKeys.has(preset.key);
                  return (
                    <Button
                      key={preset.key}
                      variant="outline"
                      className="justify-between h-auto py-2 px-3"
                      disabled={isRegistered}
                      onClick={() => {
                        onSelect(preset);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-sm">{preset.name}</span>
                        {isRegistered && (
                          <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded">
                            登録済
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {formatYen(preset.amount)}
                          /{preset.billingCycle === "yearly" ? "年" : "月"}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              該当するサービスが見つかりません
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
