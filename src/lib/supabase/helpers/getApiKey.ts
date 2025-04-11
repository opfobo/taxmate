import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, api_key, usage_count, max_usage")
      .eq("service", service)
      .eq("is_active", true)
      .lt("usage_count", supabase.literal("max_usage")) // nicht über Limit
      .order("usage_count", { ascending: true }) // am wenigsten verbraucht
      .limit(1);

    if (error) {
      console.error("❌ Supabase-Fehler beim Laden des API-Keys:", error);
      return null;
    }

    const selectedKey = data?.[0];

    if (!selectedKey) {
      console.warn(`⚠️ Kein verfügbarer API-Key für '${service}' gefunden (alle verbraucht?).`);
      return null;
    }

    // Optional: +1 usage_count hochzählen
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
