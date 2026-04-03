"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const errorMessages: Record<string, string> = {
    CredentialsSignin: "メールアドレスまたはパスワードが正しくありません。",
    CfAccessFailed: "Cloudflare認証に失敗しました。",
    AccountDisabled: "このアカウントは無効化されています。管理者にお問い合わせください。",
  };

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setErrorMsg(errorMessages.CredentialsSignin);
      setLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          <LogIn className="h-5 w-5" />
          レシートプランナー
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          LAN内ログイン
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(errorParam || errorMsg) && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600">
            {errorMsg || errorMessages[errorParam!] || "ログインに失敗しました。"}
          </div>
        )}

        <form onSubmit={handleCredentials} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">
              メールアドレス
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs">
              パスワード
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        <p className="text-[10px] text-center text-muted-foreground">
          外部からはCloudflare Accessで自動ログインされます
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
