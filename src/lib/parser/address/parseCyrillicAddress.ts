// src/lib/parser/parseCyrillicAddress.ts

import { transliterate as tr } from 'transliteration';

export interface ParsedCyrillicAddress {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  postal_code?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  block?: string;
  apartment?: string;
  raw: string;
  translit?: Record<string, string>;
}

export function parseCyrillicAddress(input: string): ParsedCyrillicAddress {
  const raw = input.trim();
  const lines = raw.split(/[\n\r,]+/).map(l => l.trim()).filter(Boolean);
  const joined = lines.join(' ');

  const result: ParsedCyrillicAddress = {
    name: '',
    phone: '',
    raw,
  };

  const translit: Record<string, string> = {};

  // Name (3 Teile, Großbuchstaben)
  const nameMatch = joined.match(/[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/);
  if (nameMatch) {
    result.name = nameMatch[0];
    translit.name = tr(result.name);
  }

  // Telefonnummer
  const phoneMatch = joined.match(/(?:\+7|8)?[\s\-]?(\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/);
  if (phoneMatch) {
    result.phone = `'${phoneMatch[0].replace(/[^\d]/g, '')}`;
  }

  // Email
  const emailMatch = joined.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Geburtstag
  const birthdayMatch = joined.match(/\b(\d{2}[./-]\d{2}[./-](?:\d{4}|\d{2}))\b/);
  if (birthdayMatch) {
    result.birthday = birthdayMatch[1].replace(/[/-]/g, '.');
  }

  // PLZ
  const postalMatch = joined.match(/\b\d{6}\b/);
  if (postalMatch) result.postal_code = postalMatch[0];

  // Region
  const regionMatch = joined.match(/([А-Яа-яё\- ]+?)\s+(обл\.?|область|край|республика)/i);
  if (regionMatch) {
    result.region = regionMatch[0];
    translit.region = tr(result.region);
  }

  // Stadt
  const cityMatch = joined.match(/(?:г\.\s?|Г\.\s?|город\s)?([А-Яа-яё\- ]+?)(?=\s+(ул|улица|пер|проспект|д\.|дом|переулок))/);
  if (cityMatch) {
    result.city = cityMatch[1].trim();
    translit.city = tr(result.city);
  }

  // Straße
  const streetMatch = joined.match(/(?:ул\.?|улица|проспект|пер\.?|переулок)\s?([А-Яа-яё0-9\-" ]+)/);
  if (streetMatch) {
    result.street = streetMatch[1].trim();
    translit.street = tr(result.street);
  }

  // Hausnummer (auch ohne д.)
  const houseMatch = joined.match(/(?:д\.?\s?|дом\s?)?(\d+[а-яА-Яа-я]*)/);
  if (houseMatch) result.house = houseMatch[1];

  // Block
  const blockMatch = joined.match(/корп(?:\.|ус)?\s?(\d+)/i);
  if (blockMatch) result.block = blockMatch[1];

  // Wohnung
  const kvMatch = joined.match(/кв\.?\s?(\d+)/);
  if (kvMatch) result.apartment = kvMatch[1];

  result.translit = translit;
  return result;
}
