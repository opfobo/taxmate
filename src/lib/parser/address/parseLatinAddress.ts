import { ParsedAddress } from "./types";

export function parseLatinAddress(input: string): ParsedAddress {
  const cleaned = input.replace(/\s+/g, " ").trim();
  const result: ParsedAddress = {
    postalCode: match(cleaned, /\b\d{5,6}\b/),
    region: null,
    city: match(cleaned, /\b([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/),
    street: match(cleaned, /\b(?:Street|St\.?|Ave\.?|Avenue|Road|Rd\.?)\s+[A-Z][a-z0-9\s]+/i),
    house: match(cleaned, /\b\d+[A-Za-z]?\b/),
    building: null,
    apartment: match(cleaned, /\bApt\.?\s?(\d+)/i),
    fullName: match(cleaned, /\b([A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/),
    phone: match(cleaned, /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}/),
    email: match(cleaned, /[\w.-]+@[\w.-]+\.\w+/),
    birthday: match(cleaned, /\b\d{2}[./-]\d{2}[./-]\d{4}\b/)
  };

  return result;
}

function match(input: string, regex: RegExp): string | null {
  const match = input.match(regex);
  return match ? match[0].trim() : null;
}
