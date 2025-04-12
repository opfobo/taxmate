import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  try {
    const session = supabase.auth.getSession();
    const accessToken = (await session)?.data?.session?.access_token;

    const response = await fetch(
      `https://ibauptditdqcwtpfnqkb.supabase.co/functions/v1/get_api_key?service=${service}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      console.warn("❌ getApiKey Edge Function Fehler:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.api_key ?? null;
  } catch (err) {
    console.error("❌ getApiKey Fehler:", err);
    return null;
  }
}

