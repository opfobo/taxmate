import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ConsumerField {
  [key: string]: string;
}

export async function saveConsumerWithAddress(
  inputText: string,
  consumerData: ConsumerField,
  t: (key: string) => string
): Promise<boolean> {
  const { data: authUser } = await supabase.auth.getUser();
  const user_id = authUser?.user?.id;

  if (!user_id) {
    toast({
      title: t("consumer_save_error"),
      description: "User not authenticated.",
      variant: "destructive",
    });
    return false;
  }

  try {
    // 1. Insert into consumers
    const { data: consumerInsert, error: consumerError } = await supabase
      .from("consumers")
      .insert([
        {
          user_id,
          full_name: consumerData.name || null,
          email: consumerData.email || null,
          phone: consumerData.phone?.replace(/[^\d+]/g, "") || null,
          birthday: consumerData.birthday || null,
          other: consumerData.other || null,
          raw_input: inputText.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (consumerError || !consumerInsert?.id) {
      throw consumerError || new Error("Consumer insert failed");
    }

    const consumer_id = consumerInsert.id;

    // 2. Insert into addresses
    const { error: addressError } = await supabase.from("addresses").insert([
      {
        user_id,
        type: "home",
        street: consumerData.street || null,
        house_number: consumerData.house_number || null,
        block: consumerData.block || null,
        kv: consumerData.kv || null,
        zip: consumerData.postal_code || null,
        city: consumerData.city || null,
        country: consumerData.country || null,
        phone: consumerData.phone?.replace(/[^\d+]/g, "") || null,
        consumer_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (addressError) {
      throw addressError;
    }

    toast({
      title: t("consumer_saved_title"),
      description: t("consumer_saved_description"),
    });

    return true;
  } catch (err: any) {
    console.error("Unexpected save error:", err);
    toast({
      title: t("consumer_save_error"),
      description: err?.message || "Save failed unexpectedly.",
      variant: "destructive",
    });
    return false;
  }
}
