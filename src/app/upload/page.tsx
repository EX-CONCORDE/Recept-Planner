"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">レシート撮影</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Phase 2 で実装予定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
            <div className="flex gap-4">
              <Camera className="h-12 w-12" />
              <Upload className="h-12 w-12" />
            </div>
            <p className="text-center text-sm">
              カメラ撮影・画像アップロード機能は
              <br />
              Phase 2（AI連携）で実装されます
            </p>
            <p className="text-center text-xs">
              現在は「支出」ページから手動で登録できます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
