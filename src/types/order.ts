export type OrderType = 'fulfillment' | 'supplier' | 'search-request';

export interface Order {
  id: string;
  user_id: string;
  consumer_id?: string;
  supplier_id?: string;
  billing_address_id?: string;
  shipping_address_id?: string;
  order_date: string;
  amount: number;
  currency: string;
  vat_rate: number;
  notes?: string;
  status: string;
  order_number: string;
  order_type: OrderType; // <--- NEU
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  image_urls?: string[]; // optional: falls dein System Mehrfachbilder nutzt
}
