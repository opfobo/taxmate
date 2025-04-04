// src/lib/parser/parseCyrillicAddress.ts

export interface ParsedCyrillicAddress {
  name: string;
  phone: string;
  postal_code?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  block?: string;
  apartment?: string;
  birthday?: string;
  email?: string;
  raw: string;
}

export function parseCyrillicAddress(input: string): ParsedCyrillicAddress {
  const raw = input.trim();
  const lines = raw.split(/\n|\r|,/).map(l => l.trim()).filter(Boolean);
  const joined = lines.join(" ");

  const result: ParsedCyrillicAddress = {
    name: '',
    phone: '',
    raw,
  };

  // 📞 Telefonnummer
  const phoneMatch = joined.match(/(?:\+7|8)?[\s\-]?(\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/);
  if (phoneMatch) {
    result.phone = `'${phoneMatch[0].replace(/[^\d]/g, '')}`;
  }

  // 📧 E-Mail
  const emailMatch = joined.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // 🎂 Geburtstag
  const birthdayMatch = joined.match(/\b(\d{2}[./-]\d{2}[./-](?:\d{4}|\d{2}))\b/);
  if (birthdayMatch) {
    result.birthday = birthdayMatch[1].replace(/\//g, '.');
  }

  // 🧍‍♂️ Name
  const nameMatch = joined.match(/[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/);
  if (nameMatch) {
    result.name = nameMatch[0];
  }

  // 📦 PLZ
  const postalMatch = joined.match(/\b\d{6}\b/);
  if (postalMatch) result.postal_code = postalMatch[0];

  // 🏙️ Stadt
  const cityMatch = joined.match(/г\.\s?[А-Яа-яё\- ]+/);
  if (cityMatch) result.city = cityMatch[0].replace(/^г\.\s?/, '').trim();

  // 🛣️ Straße
  const streetMatch = joined.match(/ул\.?\s?[А-Яа-яё\- ]+/);
  if (streetMatch) result.street = streetMatch[0].replace(/^ул\.?\s?/, '').trim();

  // 🏠 Hausnummer
  const houseMatch = joined.match(/д\.\s?(\d+[а-яА-Яа-я]*)/);
  if (houseMatch) result.house = houseMatch[1];

  // 🧱 Korpus / Block
  const blockMatch = joined.match(/корп(?:\.|ус)?\s?(\d+)/i);
  if (blockMatch) result.block = blockMatch[1];

  // 🚪 Wohnung
  const kvMatch = joined.match(/кв\.?\s?(\d+)/);
  if (kvMatch) result.apartment = kvMatch[1];

  // 🌍 Region / Oblast / Krai / Respublika
  const regionPatterns = [
    /([А-Яа-яё\- ]+?)\s*(обл\.|область)/i,
    /([А-Яа-яё\- ]+?)\s*(край)/i,
    /([А-Яа-яё\- ]+?)\s*(респ\.|республика)/i,
  ];

  for (const pattern of regionPatterns) {
    const match = joined.match(pattern);
    if (match) {
      result.region = match[0]
        .replace(/(обл\.?|область|край|респ\.?|республика)/i, '')
        .trim();
      break;
    }
  }

  return result;
}
