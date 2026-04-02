"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { toast } from "sonner";
import { Users, Shield, ShieldCheck, Ban, RotateCcw } from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    if (json.success) setUsers(json.data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleActive(user: UserData) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(
        user.isActive ? `${user.name} を無効化しました` : `${user.name} を有効化しました`,
      );
      fetchUsers();
    } else {
      toast.error(json.error);
    }
  }

  async function handleToggleRole(user: UserData) {
    const newRole = user.role === "admin" ? "member" : "admin";
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(
        `${user.name} を${newRole === "admin" ? "管理者" : "メンバー"}に変更しました`,
      );
      fetchUsers();
    } else {
      toast.error(json.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          ユーザー管理
        </h1>
        <CreateUserDialog onCreated={fetchUsers} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 ${
                  !user.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{user.name}</span>
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        <ShieldCheck className="h-3 w-3" />
                        管理者
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        <Shield className="h-3 w-3" />
                        メンバー
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="inline-flex rounded-full bg-red-100 dark:bg-red-900 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                        無効
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleToggleRole(user)}
                    title={
                      user.role === "admin"
                        ? "メンバーに降格"
                        : "管理者に昇格"
                    }
                  >
                    {user.role === "admin" ? "降格" : "昇格"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs h-7 px-2 ${
                      user.isActive
                        ? "text-red-600 hover:text-red-700"
                        : "text-green-600 hover:text-green-700"
                    }`}
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.isActive ? (
                      <>
                        <Ban className="h-3 w-3 mr-1" />
                        無効化
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        有効化
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
