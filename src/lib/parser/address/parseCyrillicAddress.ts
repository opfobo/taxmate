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
      const clean = line.match(/\d{7,}/)?.[0] ?? line;
      result.phone = {
        original: clean,
        translit: transliterate(clean),
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
      const clean = line.replace(/\//g, ".");
      result.birthday = {
        original: clean,
        translit: transliterate(clean),
      };
      continue;
    }

    // PLZ
    if (/\b\d{6}\b/.test(line)) {
      const code = line.match(/\b\d{6}\b/)?.[0] ?? line;
      result.postal_code = {
        original: code,
        translit: transliterate(code),
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

    // Stadt
    if (/^г[.\s]/.test(normalized) || /санкт[- ]петербург/.test(normalized)) {
      const cityClean = line.replace(/^г[.\s]*/i, "").trim();
      result.city = {
        original: cityClean,
        translit: transliterate(cityClean),
      };
      continue;
    }

    // Straße
    if (/ул\.?|улица|проспект|переулок|пр\.|пер\./.test(normalized)) {
      const streetMatch = line.match(/(ул\.?|улица|проспект|переулок|пр\.|пер\.)\s?([А-Яа-яё0-9.,\-\s]+)/i);
      const clean = streetMatch?.[2]?.trim() ?? line;
      result.street = {
        original: clean,
        translit: transliterate(clean),
      };
      continue;
    }

    // Hausnummer
    if (/д\.|дом\s?\d+/.test(normalized)) {
      const houseMatch = line.match(/д\.?\s?(\d+[а-яА-Яа-я]*)/);
      if (houseMatch) {
        const clean = houseMatch[1];
        result.house = {
          original: clean,
          translit: transliterate(clean),
        };
      }
      continue;
    }

    // Block / корпус
    if (/корп\.|корпус/.test(normalized)) {
      const blockMatch = line.match(/корп(?:\.|ус)?\s?(\d+)/i);
      if (blockMatch) {
        const clean = blockMatch[1];
        result.block = {
          original: clean,
          translit: transliterate(clean),
        };
      }
      continue;
    }

    // Wohnung
    if (/кв\.|квартира/.test(normalized)) {
      const aptMatch = line.match(/кв\.?\s?(\d+)/);
      if (aptMatch) {
        const clean = aptMatch[1];
        result.apartment = {
          original: clean,
          translit: transliterate(clean),
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

    // Unrecognized
    result.unrecognized!.push(line);
  }

  return result;
}
