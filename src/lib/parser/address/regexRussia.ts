// src/lib/parser/address/regexRussia.ts

export const regexRussia = {
  // Matches postal code: 6 digits at beginning or end
  postalCode: /\b\d{6}\b/,

  // Matches Russian regions or oblasts (incl. Московская область, Ленинградская область, etc.)
  oblast: /\b(?:[А-ЯЁа-яё]+\s(?:область|край|республика|АО|г(?:ород)?|район|автономный округ))\b/,

  // Matches cities (Москва, Санкт-Петербург, Омск...)
  city: /\b(?:г\.?\s?)?[А-ЯЁа-яё\s\-]{2,}(?=\,|\sул|$)/,

  // Matches street with house number (e.g., ул. Ленина 10 к2)
  street: /\b(?:ул\.?|улица|просп\.?|проспект|пер\.?|переулок|шоссе|наб\.?|набережная|бульвар|пл\.?|площадь|проезд)\s+[А-ЯЁа-яё0-9\s\-\.]+/i,

  // Matches building/corpus/korpus/kvartira info
  building: /\b(?:д\.?|дом)\s?\d+[А-Яа-яё]?(?:\s?к(?:орп)?\.?\s?\d+)?/i,
  apartment: /\b(?:кв\.?|квартира)\s?\d+/i,

  // Matches full name with three parts (Firstname Middlename Lastname)
  fullName: /\b[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+\b/,

  // Matches Russian phone numbers with various formats
  phone: /(?:\+7|8)?[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/,

  // Matches email (basic)
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,

  // Matches birthday formats: dd.mm.yyyy or dd/mm/yyyy
  birthday: /\b\d{2}[\.\/]\d{2}[\.\/]\d{2,4}\b/
};
