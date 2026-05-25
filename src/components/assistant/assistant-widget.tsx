"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bot, Loader2, Send, Trash2 } from "lucide-react";

interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    async function loadMessages() {
      const res = await fetch("/api/assistant/chat");
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
        setLoaded(true);
      }
    }
    loadMessages();
  }, [open, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const optimistic: AssistantMessage = {
      id: Date.now(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();

    if (json.success) {
      setMessages((current) => [...current, json.data]);
    } else {
      toast.error(json.error || "送信に失敗しました");
    }
    setLoading(false);
  }

  async function handleClear() {
    const res = await fetch("/api/assistant/chat", { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setMessages([]);
      toast.success("履歴を削除しました");
    } else {
      toast.error(json.error || "削除に失敗しました");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6"
        aria-label="アシスタントを開く"
      >
        <Bot className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid h-[min(720px,calc(100vh-2rem))] grid-rows-[auto_1fr_auto] sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                家計アシスタント
              </DialogTitle>
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClear}
                  aria-label="履歴を削除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div
            ref={scrollRef}
            className="min-h-0 overflow-y-auto rounded-lg border bg-muted/30 p-3"
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                何を確認しますか？
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background ring-1 ring-border"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-border">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      考え中...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-10 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={2}
              maxLength={2000}
              placeholder="質問を入力"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={loading || !input.trim()}
              aria-label="送信"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
