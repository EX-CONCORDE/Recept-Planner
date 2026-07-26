export interface AiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export interface AiContent {
  role?: "user" | "model";
  parts: AiPart[];
}

export interface GenerateTextParams {
  contents: AiContent[];
  systemInstruction: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
}

export interface AiProvider {
  generateText(params: GenerateTextParams): Promise<string>;
}
