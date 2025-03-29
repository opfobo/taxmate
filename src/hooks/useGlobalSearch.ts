
import { supabase } from "@/integrations/supabase/client";

export type SearchType = "consumers" | "orders" | "transactions" | "suppliers" | "tax_reports";

/**
 * Global search hook that provides a unified search interface across different data types
 * @param type The type of data to search for
 * @param query The search query string
 * @returns A promise that resolves to an array of search results
 */
export async function useGlobalSearch(type: SearchType, query: string): Promise<any[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  try {
    const sanitizedQuery = query.trim();
    const searchPattern = `%${sanitizedQuery}%`;

    switch (type) {
      case "consumers":
        return await searchConsumers(searchPattern);
      case "orders":
        return await searchOrders(searchPattern);
      case "transactions":
        return await searchTransactions(searchPattern);
      case "suppliers":
        return await searchSuppliers(searchPattern);
      case "tax_reports":
        return await searchTaxReports(searchPattern);
      default:
        console.error(`Unsupported search type: ${type}`);
        return [];
    }
  } catch (error) {
    console.error(`Error in global search for type ${type}:`, error);
    return [];
  }
}

/**
 * Search for consumers
 */
async function searchConsumers(searchPattern: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("consumers")
    .select("*")
    .or(
      `full_name.ilike.${searchPattern},` +
      `email.ilike.${searchPattern},` +
      `phone.ilike.${searchPattern},` +
      `postal_code.ilike.${searchPattern},` +
      `city.ilike.${searchPattern}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching consumers:", error);
    return [];
  }

  return data || [];
}

/**
 * Search for orders
 */
async function searchOrders(searchPattern: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      amount,
      currency,
      order_date,
      image_url,
      notes,
      supplier:suppliers(id, name),
      type
    `)
    .or(
      `order_number.ilike.${searchPattern},` +
      `status.ilike.${searchPattern}`
    )
    .order("order_date", { ascending: false });

  if (error) {
    console.error("Error searching orders:", error);
    return [];
  }

  return data || [];
}

/**
 * Search for transactions
 */
async function searchTransactions(searchPattern: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(
      `status.ilike.${searchPattern},` +
      `payment_method.ilike.${searchPattern},` +
      `type.ilike.${searchPattern}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching transactions:", error);
    return [];
  }

  return data || [];
}

/**
 * Search for suppliers
 */
async function searchSuppliers(searchPattern: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .or(
      `name.ilike.${searchPattern},` +
      `contact.ilike.${searchPattern},` +
      `website.ilike.${searchPattern}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching suppliers:", error);
    return [];
  }

  return data || [];
}

/**
 * Search for tax reports
 */
async function searchTaxReports(searchPattern: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("tax_reports")
    .select("*")
    .or(
      `period.ilike.${searchPattern},` +
      `id.ilike.${searchPattern}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching tax reports:", error);
    return [];
  }

  return data || [];
}
