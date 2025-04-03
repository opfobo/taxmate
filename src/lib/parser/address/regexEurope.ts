///src/lib/parser/address/regexEurope.ts
export const regexEurope = {
  name: /([A-ZÄÖÜ][a-zäöüß]+\s[A-ZÄÖÜ][a-zäöüß]+(?:\s[A-ZÄÖÜ][a-zäöüß]+)?)/,
  phone: /\+\d{2,4}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/,
  email: /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/,
  postalCode: /\b\d{4,5}\b/,
  city: /([A-ZÄÖÜ][a-zäöüß]+(?:[\s-][A-ZÄÖÜ][a-zäöüß]+)?)/,
  street: /([A-ZÄÖÜ][a-zäöüß]+(?:straße|str\.|weg|allee|gasse|ring|platz)\s?\d+[a-zA-Z]?)/,
  house: /(\d+[a-zA-Z]?)/,
  corp: null,
  flat: /(Wohnung\s\d+|Whg\.?\s?\d+)/,
};
