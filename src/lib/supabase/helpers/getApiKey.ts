import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("api_key")
      .eq("service", service)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("❌ Supabase-Fehler beim Laden des API-Keys:", error);
      return null;
    }

    if (!data) {
      console.warn(`⚠️ Kein API-Key für Service '${service}' gefunden (kein Treffer in DB).`);
      return null;
    }

    return data.api_key ?? null;
  } catch (err) {
    console.error("❌ Unbekannter Fehler in getApiKey:", err);
    return null;
  }
}
