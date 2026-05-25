import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { generateGeminiText } from "@/lib/gemini";
import {
  buildAdviceSystemInstruction,
  buildFinancialContext,
} from "@/lib/assistant-context";
import { adviceRequestSchema } from "@/lib/validations/assistant";

export async function GET() {
  const advice = await prisma.financialAdvice.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return success(
    advice
      ? {
          id: advice.id,
          yearMonth: advice.yearMonth,
          content: advice.content,
          createdAt: advice.createdAt,
        }
      : null,
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = adviceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const yearMonth = parsed.data.yearMonth;
  const financialContext = await buildFinancialContext(yearMonth);

  try {
    const content = await generateGeminiText({
      systemInstruction: buildAdviceSystemInstruction(financialContext),
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "現在の家計データを見て、保存用のアドバイスを作成してください。",
            },
          ],
        },
      ],
      temperature: 0.25,
      maxOutputTokens: 1800,
    });

    const advice = await prisma.financialAdvice.create({
      data: {
        yearMonth,
        content,
      },
    });

    return success({
      id: advice.id,
      yearMonth: advice.yearMonth,
      content: advice.content,
      createdAt: advice.createdAt,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "アドバイスの作成に失敗しました";
    return error(message, 500);
  }
}
