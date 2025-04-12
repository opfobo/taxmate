import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    if (!accessToken) {
      console.warn("⚠️ Kein Access Token verfügbar für Edge Function Call");
      return null;
    }

    const response = await fetch(
      `https://ibauptditdqcwtpfnqkb.supabase.co/functions/v1/get_api_key?service=${service}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.warn("❌ getApiKey Edge Function Fehler:", await response.text());
      return null;
    }

    const dataJson = await response.json();
    return dataJson.api_key ?? null;
  } catch (err) {
    console.error("❌ getApiKey Fehler:", err);
    return null;
  }
}
