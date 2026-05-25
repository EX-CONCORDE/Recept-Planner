import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { generateGeminiText, type GeminiContent } from "@/lib/gemini";
import {
  buildAssistantSystemInstruction,
  buildFinancialContext,
} from "@/lib/assistant-context";
import { assistantChatSchema } from "@/lib/validations/assistant";

const HISTORY_LIMIT = 24;

function toGeminiContent(message: {
  role: string;
  content: string;
}): GeminiContent {
  return {
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  };
}

export async function GET() {
  const messages = await prisma.assistantMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  return success(
    messages.reverse().map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = assistantChatSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  await prisma.assistantMessage.create({
    data: {
      role: "user",
      content: parsed.data.message,
    },
  });

  const [historyDesc, financialContext] = await Promise.all([
    prisma.assistantMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
    buildFinancialContext(),
  ]);

  const history = historyDesc.reverse().map(toGeminiContent);

  try {
    const reply = await generateGeminiText({
      systemInstruction: buildAssistantSystemInstruction(financialContext),
      contents: history,
      temperature: 0.2,
      maxOutputTokens: 1600,
    });

    const saved = await prisma.assistantMessage.create({
      data: {
        role: "assistant",
        content: reply,
      },
    });

    return success({
      id: saved.id,
      role: saved.role,
      content: saved.content,
      createdAt: saved.createdAt,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Geminiとの会話に失敗しました";
    return error(message, 500);
  }
}

export async function DELETE() {
  await prisma.assistantMessage.deleteMany();
  return success({ deleted: true });
}
