"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateUserDialogProps {
  onCreated: () => void;
}

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        role,
        password: password || undefined,
      }),
    });
    const json = await res.json();

    if (json.success) {
      toast.success(`${name} を追加しました`);
      setName("");
      setEmail("");
      setRole("member");
      setPassword("");
      setOpen(false);
      onCreated();
    } else {
      toast.error(json.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            ユーザー追加
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ユーザー追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">名前</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">メールアドレス</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ロール</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="member">メンバー</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              パスワード（Credentials認証用、Google OAuth利用時は不要）
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
