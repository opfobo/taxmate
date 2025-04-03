export interface ParsedRussianAddress {
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

export function parseRussianAddress(input: string): ParsedRussianAddress {
  const raw = input.trim();
  const lines = raw.split(/\n|\r|,/).map(l => l.trim()).filter(Boolean);
  const joined = lines.join(" ");

  const result: ParsedRussianAddress = {
    name: '',
    phone: '',
    raw,
  };

  // 📦 Telefonnr. – entfernt alles außer Zahlen, setzt ' davor für Excel
  const phoneMatch = joined.match(/(?:\+7|8)?[\s\-]?(\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/);
  if (phoneMatch) {
    result.phone = `'${phoneMatch[0].replace(/[^\d]/g, '')}`;
  }

  // 📧 Email
  const emailMatch = joined.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // 🎂 Geburtstag
  const birthdayMatch = joined.match(/\b(\d{2}[./-]\d{2}[./-](?:\d{4}|\d{2}))\b/);
  if (birthdayMatch) {
    result.birthday = birthdayMatch[1].replace(/\//g, '.');
  }

  // 🧍‍♀️ Name (heuristisch: 3 Wörter mit Großbuchstaben, z. B. Vorname Nachname Vatersname)
  const nameMatch = joined.match(/[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/);
  if (nameMatch) {
    result.name = nameMatch[0];
  }

  // 🏢 Adresse (sehr rudimentär, aufteilbar in manuelle Felder später)
  const postalMatch = joined.match(/\b\d{6}\b/);
  if (postalMatch) result.postal_code = postalMatch[0];

  const cityMatch = joined.match(/г\.\s?[А-Яа-яё\- ]+/);
  if (cityMatch) result.city = cityMatch[0].replace(/^г\.\s?/, '').trim();

  const streetMatch = joined.match(/ул\.?\s?[А-Яа-яё\- ]+/);
  if (streetMatch) result.street = streetMatch[0].replace(/^ул\.?\s?/, '').trim();

  const houseMatch = joined.match(/д\.\s?(\d+[а-яА-Яа-я]*)/);
  if (houseMatch) result.house = houseMatch[1];

  const blockMatch = joined.match(/корп(?:\.|ус)?\s?(\d+)/i);
  if (blockMatch) result.block = blockMatch[1];

  const kvMatch = joined.match(/кв\.?\s?(\d+)/);
  if (kvMatch) result.apartment = kvMatch[1];

  return result;
}
