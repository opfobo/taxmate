
// src/lib/gpt/functions/parseAddressWithGPT.ts

import { SYSTEM_PROMPT_ADDRESS } from "@/lib/gpt/prompts/address";
import { getOpenAiClient } from "@/lib/gpt/gptClient";

export async function parseAddressWithGPT(input: string): Promise<Record<string, string> | null> {
  try {
    const openai = await getOpenAiClient();
    if (!openai) return null;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      temperature: 0.2,
      response_format: { type: "json" }, // Fix: Use object format instead of string
      messages: [
        { role: "system", content: SYSTEM_PROMPT_ADDRESS },
        { role: "user", content: input.slice(0, 500) } // Cap at 500 chars
      ],
    });

    const parsed = completion.choices?.[0]?.message?.content;
    if (!parsed) return null;

    return JSON.parse(parsed);
  } catch (error) {
    console.error("❌ GPT address parsing failed:", error);
    return null;
  }
}
