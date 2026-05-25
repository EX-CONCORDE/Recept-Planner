import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import {
  getGeminiSettings,
  maskGeminiSettings,
  saveGeminiSettings,
} from "@/lib/gemini-settings";
import { updateGeminiSettingsSchema } from "@/lib/validations/gemini-settings";

export async function GET() {
  const settings = await getGeminiSettings();
  return success(maskGeminiSettings(settings));
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const parsed = updateGeminiSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const settings = await saveGeminiSettings(parsed.data);
  return success(maskGeminiSettings(settings));
}
