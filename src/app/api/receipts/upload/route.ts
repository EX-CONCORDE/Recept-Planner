import { NextRequest } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { isAllowedImageType } from "@/lib/image-utils";
import { requireAuth } from "@/lib/session";

const STORAGE_PATH = process.env.RECEIPT_STORAGE_PATH || "./data/receipts";

export async function POST(request: NextRequest) {
  const { userId } = await requireAuth();
  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return error("画像ファイルが必要です");
  }

  if (!isAllowedImageType(file.type)) {
    return error("対応形式: JPEG, PNG, WebP, HEIC");
  }

  if (file.size > 10 * 1024 * 1024) {
    return error("ファイルサイズは10MB以下にしてください");
  }

  await mkdir(STORAGE_PATH, { recursive: true });

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${timestamp}.${ext}`;
  const filePath = join(STORAGE_PATH, fileName);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));

  const receipt = await prisma.receipt.create({
    data: {
      filePath,
      status: "uploaded",
      userId,
    },
  });

  return success(receipt, 201);
}
