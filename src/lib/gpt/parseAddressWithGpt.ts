import { getApiKey } from "@/supabase/helpers/getApiKey";

export interface ParsedAddressResult {
  name?: string;
  street?: string;
  house_number?: string;
  block?: string;
  kv?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  other?: string;
  confidence?: number;
  raw?: string;
}

export const parseAddressWithGpt = async (rawAddress: string): Promise<ParsedAddressResult | null> => {
  const key = await getApiKey("openai");
  if (!key) {
    console.warn("⚠️ Kein OpenAI-Key verfügbar");
    return null;
  }

  const systemPrompt = `
Du bist ein Adressparser. Du analysierst unstrukturierte Adressinformationen und gibst strukturierte Felder zurück.
Fehlende Werte (z. B. Postleitzahl oder Region) darfst du aus dem Kontext ergänzen oder intelligent schätzen.
Antwortformat ist JSON ohne Erklärung:

{
  "name": string | null,
  "street": string | null,
  "house_number": string | null,
  "block": string | null,
  "kv": string | null,
  "city": string | null,
  "postal_code": string | null,
  "country": string | null,
  "phone": string | null,
  "email": string | null,
  "other": string | null
}
Wenn du unsicher bist, gib lieber null zurück als etwas Falsches.
`;

  const userPrompt = `Bitte parse folgende Adresse:\n\n${rawAddress.trim()}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() }
      ]
    })
  });

  const json = await response.json();

  if (!response.ok || !json.choices?.[0]?.message?.content) {
    console.error("❌ GPT-Adressparser-Fehler:", json);
    return null;
  }

  try {
    const parsed = JSON.parse(json.choices[0].message.content);
    return {
      ...parsed,
      raw: rawAddress
    };
  } catch (err) {
    console.warn("⚠️ GPT-Response konnte nicht geparsed werden:", err);
    return null;
  }
};
