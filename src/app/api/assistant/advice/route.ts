import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { generateGeminiText } from "@/lib/gemini";
import {
  buildAdviceSystemInstruction,
  buildFinancialContext,
} from "@/lib/assistant-context";
import { adviceRequestSchema } from "@/lib/validations/assistant";
import { yearMonthSchema } from "@/lib/validations/monthly-plan";

export async function GET(request: NextRequest) {
  const yearMonth = request.nextUrl.searchParams.get("yearMonth");
  const parsed = yearMonthSchema.safeParse(yearMonth);
  if (!parsed.success) return error("YYYY-MM形式で指定してください");

  const advice = await prisma.financialAdvice.findFirst({
    where: { yearMonth: parsed.data },
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
  if (!yearMonth) return error("YYYY-MM形式で指定してください");
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

    const advice = await prisma.$transaction(async (tx) => {
      await tx.financialAdvice.deleteMany({
        where: { yearMonth },
      });

      return tx.financialAdvice.create({
        data: { yearMonth, content },
      });
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
