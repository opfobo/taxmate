
import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("api_key")
    .eq("service", service)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error(`❌ API-Key für ${service} konnte nicht geladen werden:`, error?.message);
    return null;
  }

  return data.api_key;
}
