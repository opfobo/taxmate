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
  unrecognized: string[];
}

export function parseCyrillicAddress(input: string): ParsedCyrillicAddress {
  const raw = input.trim();
  const lines = input
  .split(/[\r\n]+/) // Fange alle Umbrucharten ab
  .map((line) => line.trim())
  .filter(Boolean);
  const result: ParsedCyrillicAddress = {
    raw,
    unrecognized: [],
  };

  for (const line of lines) {
    const normalized = line.toLowerCase();

    // 📧 E-Mail
    if (/[\w.-]+@[\w.-]+\.[a-z]{2,}/i.test(line)) {
      result.email = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // 📞 Telefonnummer
    if (/(?:\+7|8)?[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/.test(normalized)) {
      const digits = line.replace(/[^\d]/g, '');
      result.phone = {
        original: digits,
        translit: transliterate(digits),
      };
      continue;
    }

    // 🎂 Geburtstag
    if (/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/.test(normalized)) {
      const clean = line.replace(/\//g, ".");
      result.birthday = {
        original: clean,
        translit: transliterate(clean),
      };
      continue;
    }

    // 🏙️ Stadt
    if (/^г\.\s?[А-Яа-яё\- ]+/.test(normalized) || /санкт[- ]петербург/.test(normalized)) {
      const clean = line.replace(/^г\.\s*/i, "").trim();
      result.city = {
        original: clean,
        translit: transliterate(clean),
      };
      continue;
    }

    // 📦 PLZ (6-stellig)
    if (/^\d{6}$/.test(line)) {
      result.postal_code = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // 🌍 Region
    if (/обл\.|область|край|респ\.|республика/.test(normalized)) {
      result.region = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // 🛣️ Straße
    if (/ул\.?|улица|проспект|переулок|пр\.|пер\./.test(normalized)) {
      const match = line.match(/(ул\.?|улица|проспект|переулок|пр\.|пер\.)\s?(.+)/i);
      const street = match?.[2]?.trim() ?? line;
      result.street = {
        original: street,
        translit: transliterate(street),
      };
      continue;
    }

    // 🏠 Hausnummer
    if (/д\.?\s?\d+[а-я]*/.test(normalized)) {
      const match = line.match(/д\.?\s?(\d+[а-я]*)/i);
      if (match?.[1]) {
        result.house = {
          original: match[1],
          translit: transliterate(match[1]),
        };
        continue;
      }
    }

    // 🧱 Block / корпус
    if (/корп\.?|корпус/.test(normalized)) {
      const match = line.match(/корп(?:ус|\.?)\s?(\d+)/i);
      if (match?.[1]) {
        result.block = {
          original: match[1],
          translit: transliterate(match[1]),
        };
        continue;
      }
    }

    // 🚪 Wohnung / кв.
    if (/кв\.?|квартира/.test(normalized)) {
      const match = line.match(/кв\.?\s?(\d+)/i);
      if (match?.[1]) {
        result.apartment = {
          original: match[1],
          translit: transliterate(match[1]),
        };
        continue;
      }
    }

    // 🧍‍♀️ Name (3 Worte mit Großbuchstaben)
    if (/^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/.test(line)) {
      result.name = {
        original: line,
        translit: transliterate(line),
      };
      continue;
    }

    // ❓ Unrecognized
    result.unrecognized.push(line);
  }

  return result;
}
