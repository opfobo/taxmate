import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, api_key, usage_count, max_usage")
      .eq("service", service)
      .eq("is_active", true);

    if (error) {
      console.error("❌ Supabase-Fehler beim Laden des API-Keys:", error);
      return null;
    }

    const availableKeys = (data || []).filter(key => key.usage_count < key.max_usage);

    if (availableKeys.length === 0) {
      console.warn(`⚠️ Kein verfügbarer API-Key für '${service}' gefunden (alle verbraucht?).`);
      return null;
    }

    // Sortieren nach usage_count ASC
    const selectedKey = availableKeys.sort((a, b) => a.usage_count - b.usage_count)[0];

    await supabase
      .from("api_keys")
      .update({ usage_count: selectedKey.usage_count + 1 })
      .eq("id", selectedKey.id);

    return selectedKey.api_key;
  } catch (err) {
    console.error("❌ Unbekannter Fehler in getApiKey:", err);
    return null;
  }
}

