
export interface Consumer {
  id: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  region?: string;
  city?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsumerWithOrderStats extends Consumer {
  total_orders?: number;
  last_order_date?: string;
  total_order_volume?: number;
}
