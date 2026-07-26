"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TaxBreakdownCard } from "@/components/dashboard/tax-breakdown";
import { getCurrentYearMonth, formatYen } from "@/lib/format";
import { toast } from "sonner";
import { Bot, Calculator } from "lucide-react";

interface TaxBreakdown {
  grossMonthly: number;
  standardMonthly: number;
  prefecture: string;
  residentTaxSurcharge: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  nursingCare: number;
  childcareSupport: number;
  socialInsuranceTotal: number;
  incomeTax: number;
  residentTax: number;
  taxTotal: number;
  totalDeductions: number;
  netMonthly: number;
  netRate: number;
}

interface AiSettings {
  provider: "gemini" | "lmstudio";
  gemini: {
    apiKeyConfigured: boolean;
    apiKeyPreview: string | null;
    apiKeySource: "database" | "environment" | "none";
    model: string;
    apiBaseUrl: string;
  };
  lmstudio: {
    baseUrl: string;
    model: string;
  };
  receiptImageMaxDimension: number;
  receiptImageJpegQuality: number;
}

export default function SettingsPage() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [autoCalcTax, setAutoCalcTax] = useState(false);
  const [grossIncome, setGrossIncome] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [age, setAge] = useState("");
  const [prefecture, setPrefecture] = useState("東京");
  const [bonusMonths, setBonusMonths] = useState("");
  const [savingTargetAmount, setSavingTargetAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [aiProvider, setAiProvider] = useState<"gemini" | "lmstudio">("gemini");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [clearGeminiApiKey, setClearGeminiApiKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash-lite");
  const [geminiApiBaseUrl, setGeminiApiBaseUrl] = useState(
    "https://generativelanguage.googleapis.com/v1beta",
  );
  const [lmstudioBaseUrl, setLmstudioBaseUrl] = useState(
    "http://localhost:1234/v1",
  );
  const [lmstudioModel, setLmstudioModel] = useState("google/gemma-4-e4b");
  const [receiptImageMaxDimension, setReceiptImageMaxDimension] =
    useState("1024");
  const [receiptImageJpegQuality, setReceiptImageJpegQuality] = useState("80");
  const [savingAi, setSavingAi] = useState(false);

  // 都道府県リスト取得
  useEffect(() => {
    fetch("/api/tax-estimate")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPrefectures(json.data.prefectures);
      });
  }, []);

  useEffect(() => {
    async function loadAiSettings() {
      const res = await fetch("/api/settings/gemini");
      const json = await res.json();
      if (json.success) {
        const d = json.data as AiSettings;
        setAiSettings(d);
        setAiProvider(d.provider);
        setGeminiModel(d.gemini.model);
        setGeminiApiBaseUrl(d.gemini.apiBaseUrl);
        setLmstudioBaseUrl(d.lmstudio.baseUrl);
        setLmstudioModel(d.lmstudio.model);
        setReceiptImageMaxDimension(String(d.receiptImageMaxDimension));
        setReceiptImageJpegQuality(String(d.receiptImageJpegQuality));
      }
    }
    loadAiSettings();
  }, []);

  // 月次プラン読み込み
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/monthly-plans/${yearMonth}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setAutoCalcTax(d.autoCalcTax ?? false);
        setGrossIncome(d.grossIncome ? String(d.grossIncome) : "");
        setMonthlyIncome(String(d.monthlyIncome || ""));
        setAge(d.age ? String(d.age) : "");
        setPrefecture(d.prefecture || "東京");
        setBonusMonths(d.bonusMonths ? String(d.bonusMonths) : "");
        setSavingTargetAmount(String(d.savingTargetAmount || ""));
        setTaxBreakdown(d.taxBreakdown ?? null);
      }
    }
    load();
  }, [yearMonth]);

  // 額面入力時にリアルタイム税計算
  const estimateTax = useCallback(async () => {
    const gross = Number(grossIncome);
    if (!gross || gross <= 0) {
      setTaxBreakdown(null);
      return;
    }
    const res = await fetch("/api/tax-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grossMonthly: gross,
        prefecture: prefecture || undefined,
        age: age ? Number(age) : undefined,
        bonusMonths: bonusMonths ? Number(bonusMonths) : undefined,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setTaxBreakdown(json.data);
      if (autoCalcTax) {
        setMonthlyIncome(String(json.data.netMonthly));
      }
    }
  }, [grossIncome, prefecture, age, bonusMonths, autoCalcTax]);

  useEffect(() => {
    if (autoCalcTax && grossIncome) {
      const timer = setTimeout(estimateTax, 300);
      return () => clearTimeout(timer);
    }
  }, [grossIncome, prefecture, age, bonusMonths, autoCalcTax, estimateTax]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/monthly-plans/${yearMonth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyIncome: Number(monthlyIncome) || 0,
        grossIncome: grossIncome ? Number(grossIncome) : null,
        age: age ? Number(age) : null,
        prefecture: prefecture || null,
        bonusMonths: bonusMonths ? Number(bonusMonths) : null,
        autoCalcTax,
        savingTargetAmount: Number(savingTargetAmount) || 0,
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("設定を保存しました");
      if (json.data.taxBreakdown) {
        setTaxBreakdown(json.data.taxBreakdown);
        setMonthlyIncome(String(json.data.monthlyIncome));
      }
    } else {
      toast.error(json.error || "保存に失敗しました");
    }
    setSaving(false);
  }

  async function handleSaveAi() {
    setSavingAi(true);
    const apiKey = geminiApiKey.trim();
    const res = await fetch("/api/settings/gemini", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: aiProvider,
        geminiApiKey: clearGeminiApiKey || !apiKey ? undefined : apiKey,
        clearGeminiApiKey,
        geminiModel: geminiModel.trim(),
        geminiApiBaseUrl: geminiApiBaseUrl.trim(),
        lmstudioBaseUrl: lmstudioBaseUrl.trim(),
        lmstudioModel: lmstudioModel.trim(),
        receiptImageMaxDimension: Number(receiptImageMaxDimension),
        receiptImageJpegQuality: Number(receiptImageJpegQuality),
      }),
    });
    const json = await res.json();
    if (json.success) {
      const d = json.data as AiSettings;
      setAiSettings(d);
      setAiProvider(d.provider);
      setGeminiApiKey("");
      setClearGeminiApiKey(false);
      setGeminiModel(d.gemini.model);
      setGeminiApiBaseUrl(d.gemini.apiBaseUrl);
      setLmstudioBaseUrl(d.lmstudio.baseUrl);
      setLmstudioModel(d.lmstudio.model);
      setReceiptImageMaxDimension(String(d.receiptImageMaxDimension));
      setReceiptImageJpegQuality(String(d.receiptImageJpegQuality));
      toast.success("AI設定を保存しました");
    } else {
      toast.error(json.error || "AI設定の保存に失敗しました");
    }
    setSavingAi(false);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">設定</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AIプロバイダ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiProvider("gemini")}
              className={`flex-1 rounded-lg border p-3 text-center text-sm transition-colors ${
                aiProvider === "gemini"
                  ? "border-primary bg-primary/5 font-semibold"
                  : "hover:bg-secondary"
              }`}
            >
              Gemini API
            </button>
            <button
              onClick={() => setAiProvider("lmstudio")}
              className={`flex-1 rounded-lg border p-3 text-center text-sm transition-colors ${
                aiProvider === "lmstudio"
                  ? "border-primary bg-primary/5 font-semibold"
                  : "hover:bg-secondary"
              }`}
            >
              LM Studio（ローカル）
            </button>
          </div>

          {aiProvider === "gemini" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="gemini-api-key">APIキー</Label>
                <Input
                  id="gemini-api-key"
                  type="password"
                  placeholder={
                    aiSettings?.gemini.apiKeyConfigured
                      ? "保存済みのキーを維持"
                      : "AIza..."
                  }
                  value={geminiApiKey}
                  disabled={clearGeminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    {aiSettings?.gemini.apiKeyConfigured
                      ? `設定済み ${aiSettings.gemini.apiKeyPreview ?? ""}`
                      : "未設定"}
                    {aiSettings?.gemini.apiKeySource === "environment" &&
                      " / 環境変数"}
                    {aiSettings?.gemini.apiKeySource === "database" &&
                      " / DB保存"}
                  </span>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={clearGeminiApiKey}
                      onChange={(e) => setClearGeminiApiKey(e.target.checked)}
                    />
                    クリア
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="gemini-model">モデル</Label>
                <Input
                  id="gemini-model"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  list="gemini-models"
                />
                <datalist id="gemini-models">
                  <option value="gemini-2.5-flash-lite" />
                  <option value="gemini-2.5-flash" />
                  <option value="gemini-2.5-pro" />
                </datalist>
              </div>

              <div className="space-y-1">
                <Label htmlFor="gemini-api-base-url">API URL</Label>
                <Input
                  id="gemini-api-base-url"
                  value={geminiApiBaseUrl}
                  onChange={(e) => setGeminiApiBaseUrl(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="lmstudio-base-url">API URL</Label>
                <Input
                  id="lmstudio-base-url"
                  value={lmstudioBaseUrl}
                  onChange={(e) => setLmstudioBaseUrl(e.target.value)}
                  placeholder="http://localhost:1234/v1"
                />
                <p className="text-[10px] text-muted-foreground">
                  LM Studioの「Developer」タブでローカルサーバーを起動した際のURL
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lmstudio-model">モデル</Label>
                <Input
                  id="lmstudio-model"
                  value={lmstudioModel}
                  onChange={(e) => setLmstudioModel(e.target.value)}
                  placeholder="google/gemma-4-e4b"
                />
                <p className="text-[10px] text-muted-foreground">
                  LM Studioに読み込んだモデルの識別子（LM Studio画面に表示される名前）
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="receipt-image-size">画像サイズ</Label>
              <Input
                id="receipt-image-size"
                type="number"
                min={256}
                max={2048}
                value={receiptImageMaxDimension}
                onChange={(e) => setReceiptImageMaxDimension(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-image-quality">JPEG品質</Label>
              <Input
                id="receipt-image-quality"
                type="number"
                min={1}
                max={100}
                value={receiptImageJpegQuality}
                onChange={(e) => setReceiptImageJpegQuality(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSaveAi} disabled={savingAi} className="w-full">
            {savingAi ? "保存中..." : "AI設定を保存"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">対象月</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 税金自動計算モード切替 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            収入設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAutoCalcTax(false);
                setTaxBreakdown(null);
              }}
              className={`flex-1 rounded-lg border p-3 text-center text-sm transition-colors ${
                !autoCalcTax
                  ? "border-primary bg-primary/5 font-semibold"
                  : "hover:bg-secondary"
              }`}
            >
              手取りを直接入力
            </button>
            <button
              onClick={() => setAutoCalcTax(true)}
              className={`flex-1 rounded-lg border p-3 text-center text-sm transition-colors ${
                autoCalcTax
                  ? "border-primary bg-primary/5 font-semibold"
                  : "hover:bg-secondary"
              }`}
            >
              額面から自動計算
            </button>
          </div>

          {autoCalcTax ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="gross">額面月収（円）</Label>
                <Input
                  id="gross"
                  type="number"
                  placeholder="例: 300000"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>都道府県</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                  >
                    {prefectures.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>年齢</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    40歳以上で介護保険適用
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Label>賞与（月数換算）</Label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.5"
                  value={bonusMonths}
                  onChange={(e) => setBonusMonths(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  例: 夏冬合計4ヶ月分なら 4
                </p>
              </div>
              {taxBreakdown && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-center">
                  <p className="text-xs text-muted-foreground">自動計算された手取り</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatYen(taxBreakdown.netMonthly)}
                    <span className="text-xs text-muted-foreground ml-1">
                      /月 ({taxBreakdown.netRate}%)
                    </span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="income">手取り月収（円）</Label>
              <Input
                id="income"
                type="number"
                placeholder="例: 237000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">貯金目標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="saving">貯金目標額（円/月）</Label>
            <Input
              id="saving"
              type="number"
              placeholder="例: 50000"
              value={savingTargetAmount}
              onChange={(e) => setSavingTargetAmount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "保存中..." : "保存"}
      </Button>

      {/* 税金内訳カード */}
      {autoCalcTax && taxBreakdown && <TaxBreakdownCard data={taxBreakdown} />}
    </div>
  );
}
