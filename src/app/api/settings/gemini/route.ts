import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import {
  getAiSettings,
  maskAiSettings,
  saveAiSettings,
} from "@/lib/ai-settings";
import { updateAiSettingsSchema } from "@/lib/validations/ai-settings";

export async function GET() {
  const settings = await getAiSettings();
  return success(maskAiSettings(settings));
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const parsed = updateAiSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const settings = await saveAiSettings(parsed.data);
  return success(maskAiSettings(settings));
}
