
import { supabase } from "@/integrations/supabase/client";

export async function getApiKey(service: string) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('service', service)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return data?.api_key || null;
  } catch (error) {
    console.error('Error in getApiKey:', error);
    return null;
  }
}
