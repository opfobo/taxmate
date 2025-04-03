///src/lib/parser/address/regexGlobal.ts
export const regexGlobal = {
  name: /[A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/, // basic 2-3 word names
  phone: /\+?\d[\d\s().-]{7,}/,
  email: /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/,
  postalCode: /\b\d{4,6}\b/,
  city: /[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/, // simple fallback
  street: /\d+\s[A-Z][a-z]+\s(?:Street|St\.|Road|Rd\.|Ave\.|Avenue|Blvd\.|Boulevard)/,
  house: /\d+[a-zA-Z]?/,
  corp: null,
  flat: null,
};
