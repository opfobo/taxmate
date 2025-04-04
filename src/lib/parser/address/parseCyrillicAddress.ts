// src/lib/parser/address/parseCyrillicAddress.ts
import { transliterate } from "./transliteration";

export interface ParsedField {
  original?: string;
  translit?: string;
}

export interface ParsedCyrillicAddress {
  name?: ParsedField;
  phone?: ParsedField;
  email?: ParsedField;
  birthday?: ParsedField;
  postal_code?: ParsedField;
  region?: ParsedField;
  city?: ParsedField;
  street?: ParsedField;
  house?: ParsedField;
  block?: ParsedField;
  apartment?: ParsedField;
  raw: string;
  unrecognized?: string[];
}

export function parseCyrillicAddress(input: string): ParsedCyrillicAddress {
  const raw = input.trim();
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  const result: ParsedCyrillicAddress = {
    raw,
    unrecognized: [],
  };

  for (const line of lines) {
    const normalized = line.toLowerCase();

    // Telefonnummer
    if (/\b(?:\+7|8)?[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/.test(normalized)) {
      result.phone = {
        original: line.match(/\d{7,}/)?.[0] ?? line,
        translit: transliterate(line),
      };
      continue;
    }

    // Email
    if (/\b[\w.-]+@[\w.-]+\.[a-z]{2,}\b/i.test(line)) {
      result.email = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // Geburtstag
    if (/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/.test(line)) {
      result.birthday = {
        original: line.replace(/\//g, "."),
        translit: transliterate(line),
      };
      continue;
    }

    // PLZ
    if (/\b\d{6}\b/.test(line)) {
      result.postal_code = {
        original: line.match(/\b\d{6}\b/)?.[0],
        translit: transliterate(line),
      };
      continue;
    }

    // Region
    if (/обл\.|область|край|респ\.|республика/.test(normalized)) {
      result.region = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // Stadt (г. Москва, Санкт-Петербург etc.)
    if (/^г[.\s]/.test(normalized) || /санкт[- ]петербург/.test(normalized)) {
      result.city = {
        original: line.replace(/^г[.\s]*/i, ""),
        translit: transliterate(line),
      };
      continue;
    }

    // Straße
    if (/ул\.?|улица|проспект|переулок|пр\.|пер\./.test(normalized)) {
      const streetMatch = line.match(/(ул\.?|улица|проспект|переулок|пр\.|пер\.)\s?([А-Яа-яё0-9.,\-\s]+)/i);
      if (streetMatch) {
        result.street = {
          original: streetMatch[2].trim(),
          translit: transliterate(streetMatch[2]),
        };
      } else {
        result.street = {
          original: line,
          translit: transliterate(line),
        };
      }
      continue;
    }

    // Hausnummer / квартира / корпус
    if (/д\.|дом\s?\d+/.test(normalized)) {
      const houseMatch = line.match(/д\.?\s?(\d+[а-яА-Яа-я]*)/);
      if (houseMatch) {
        result.house = {
          original: houseMatch[1],
          translit: transliterate(houseMatch[1]),
        };
      }
      continue;
    }

    if (/корп\.|корпус/.test(normalized)) {
      const blockMatch = line.match(/корп(?:\.|ус)?\s?(\d+)/i);
      if (blockMatch) {
        result.block = {
          original: blockMatch[1],
          translit: transliterate(blockMatch[1]),
        };
      }
      continue;
    }

    if (/кв\.|квартира/.test(normalized)) {
      const aptMatch = line.match(/кв\.?\s?(\d+)/);
      if (aptMatch) {
        result.apartment = {
          original: aptMatch[1],
          translit: transliterate(aptMatch[1]),
        };
      }
      continue;
    }

    // Name (heuristisch: 3 Wörter mit Großbuchstaben)
    if (/[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/.test(line)) {
      result.name = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // Unrecognized line
    result.unrecognized!.push(line);
  }

  return result;
}
