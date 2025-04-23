
export interface InventoryItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  invoice_date: string | null;
  supplier_name: string;
  mapping_id: string;
}

export interface OrderInventoryItem {
  id: string;
  order_id: string;
  ocr_item_id: string;
  assigned_quantity: number;
  created_at: string;
  created_by: string;
}
