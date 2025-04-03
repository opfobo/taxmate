// src/lib/parser/address/parseCyrillicAddress.ts

import { ParsedAddress } from "./types";
import {
  namePattern,
  phonePattern,
  zipPattern,
  regionPattern,
  emailPattern,
  birthdatePattern,
  streetKvPattern,
  cityPattern,
} from "./regex";

export function parseCyrillicAddress(input: string): ParsedAddress {
  const result: ParsedAddress = {
    name: null,
    phone: null,
    zip: null,
    city: null,
    region: null,
    street: null,
    kv: null,
    email: null,
    birthdate: null,
    raw: input.trim(),
  };

  const normalized = input.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

  const match = (regex: RegExp) => {
    const found = regex.exec(normalized);
    return found?.[0]?.trim() || null;
  };

  result.name = match(namePattern);
  result.phone = match(phonePattern)?.replace(/^8/, "+7").replace(/[^+\d]/g, "");
  result.zip = match(zipPattern);
  result.region = match(regionPattern);
  result.email = match(emailPattern);
  result.birthdate = match(birthdatePattern);
  result.kv = match(streetKvPattern);
  result.city = match(cityPattern);

  // Street (heuristisch: der Teil vor Hausnummer und kv)
  const kv = result.kv || "";
  const zip = result.zip || "";
  const phone = result.phone || "";
  const email = result.email || "";
  const bday = result.birthdate || "";

  let cleaned = normalized
    .replace(kv, "")
    .replace(zip, "")
    .replace(result.name || "", "")
    .replace(phone, "")
    .replace(email, "")
    .replace(bday, "")
    .replace(result.city || "", "")
    .replace(result.region || "", "")
    .trim();

  result.street = cleaned || null;

  return result;
}
