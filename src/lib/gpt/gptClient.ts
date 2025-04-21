// src/lib/gpt/gptClient.ts
import OpenAI from "openai";
import { getApiKey } from "@/lib/supabase/helpers/getApiKey";

export async function createOpenAiClient(): Promise<OpenAI | null> {
  const key = await getApiKey("openai");
  if (!key) return null;

  return new OpenAI({
    apiKey: key,
  });
}
