import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, api_key, usage_count, max_usage")
      .eq("service", service)
      .eq("is_active", true)
      .order("usage_count", { ascending: true })
      .limit(10); // erst mal alle holen

    if (error) {
      console.error("❌ Supabase-Fehler beim Laden des API-Keys:", error);
      return null;
    }

    const availableKey = data?.find(k => k.usage_count < k.max_usage);

    if (!availableKey) {
      console.warn(`⚠️ Kein API-Key für '${service}' verfügbar (alle verbraucht).`);
      return null;
    }

    // Optional: usage_count hochzählen
    await supabase
      .from("api_keys")
      .update({ usage_count: availableKey.usage_count + 1 })
      .eq("id", availableKey.id);

    return availableKey.api_key;
  } catch (err) {
    console.error("❌ Unbekannter Fehler in getApiKey:", err);
    return null;
  }
}
