
export interface Shopper {
  id: string;
  salutation?: string;
  first_name: string;
  last_name: string;
  address_line1?: string;
  address_line2?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}
