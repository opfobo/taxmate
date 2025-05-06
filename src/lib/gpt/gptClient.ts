
// src/lib/gpt/gptClient.ts
import { getApiKey } from "@/lib/supabase/helpers/getApiKey";
import OpenAI from "openai";

export async function createOpenAiClient(): Promise<OpenAI | null> {
  const key = await getApiKey("openai");
  if (!key) return null;

  return new OpenAI({
    apiKey: key,
  });
}

// Export a singleton instance for convenience
let _openaiClientPromise: Promise<OpenAI | null> | null = null;

export async function getOpenAiClient(): Promise<OpenAI | null> {
  if (!_openaiClientPromise) {
    _openaiClientPromise = createOpenAiClient();
  }
  return _openaiClientPromise;
}
