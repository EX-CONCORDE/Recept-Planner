"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/receipt/camera-capture";
import { ImageUpload } from "@/components/receipt/image-upload";
import { ExtractResult } from "@/components/receipt/extract-result";
import { Camera, Upload, Loader2 } from "lucide-react";

type Step = "choose" | "camera" | "preview" | "extracting" | "result";

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

export default function UploadPage() {
  const [step, setStep] = useState<Step>("choose");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      });
  }, []);

  function handleImage(blob: Blob) {
    setImageBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setStep("preview");
  }

  function handleFileSelect(file: File) {
    handleImage(file);
  }

  const uploadAndExtract = useCallback(async () => {
    if (!imageBlob) return;
    setStep("extracting");
    setErrorMsg(null);

    // 1. アップロード
    const formData = new FormData();
    formData.append("image", imageBlob, "receipt.jpg");

    const uploadRes = await fetch("/api/receipts/upload", {
      method: "POST",
      body: formData,
    });
    const uploadJson = await uploadRes.json();
    if (!uploadJson.success) {
      setErrorMsg(uploadJson.error || "アップロードに失敗しました");
      setStep("preview");
      return;
    }

    const rid = uploadJson.data.id;
    setReceiptId(rid);

    // 2. AI抽出
    const extractRes = await fetch(`/api/receipts/${rid}/extract`, {
      method: "POST",
    });
    const extractJson = await extractRes.json();
    if (!extractJson.success) {
      setErrorMsg(extractJson.error || "AI抽出に失敗しました");
      setStep("preview");
      return;
    }

    setExtraction(extractJson.data.extraction);
    setStep("result");
  }, [imageBlob]);

  async function handleRetry() {
    if (!receiptId) return;
    setStep("extracting");
    setErrorMsg(null);

    const res = await fetch(`/api/receipts/${receiptId}/extract`, {
      method: "POST",
    });
    const json = await res.json();
    if (json.success) {
      setExtraction(json.data.extraction);
      setStep("result");
    } else {
      setErrorMsg(json.error || "再抽出に失敗しました");
      setStep("preview");
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep("choose");
    setImageBlob(null);
    setPreviewUrl(null);
    setReceiptId(null);
    setExtraction(null);
    setErrorMsg(null);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">レシート撮影</h1>

      {step === "choose" && (
        <div className="space-y-3">
          <Button
            className="w-full gap-2 h-14 text-base"
            onClick={() => setStep("camera")}
          >
            <Camera className="h-5 w-5" />
            カメラで撮影
          </Button>
          <ImageUpload onSelect={handleFileSelect} />
        </div>
      )}

      {step === "camera" && (
        <CameraCapture
          onCapture={handleImage}
          onClose={() => setStep("choose")}
        />
      )}

      {step === "preview" && previewUrl && (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="レシートプレビュー"
            className="w-full rounded-lg"
          />
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {errorMsg}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              やり直す
            </Button>
            <Button className="flex-1 gap-2" onClick={uploadAndExtract}>
              <Upload className="h-4 w-4" />
              AIで読み取る
            </Button>
          </div>
        </div>
      )}

      {step === "extracting" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              AIがレシートを読み取り中...
            </p>
            <p className="text-xs text-muted-foreground">
              数十秒かかる場合があります
            </p>
          </CardContent>
        </Card>
      )}

      {step === "result" && extraction && receiptId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewUrl && (
            <div>
              <img
                src={previewUrl}
                alt="レシート"
                className="w-full rounded-lg object-contain max-h-[70vh] sticky top-4"
              />
            </div>
          )}
          <ExtractResult
            receiptId={receiptId}
            extraction={extraction}
            categories={categories}
            onConfirmed={reset}
            onRetry={handleRetry}
          />
        </div>
      )}
    </div>
  );
}
