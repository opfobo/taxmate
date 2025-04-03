export interface ParsedAddress {
  name: string | null;
  phone: string | null;
  zip: string | null;
  city: string | null;
  region: string | null;
  street: string | null;
  kv: string | null;
  email: string | null;
  birthdate: string | null;
  raw: string;
}
