// Sehr einfache Transliterationstabelle – erweitert und konsolidiert
const table: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd',
  е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',

  // Zeichen entfernen
  '«': '', '»': '', '“': '', '”': '', '„': '', '…': '',
  '–': '-', '—': '-', '–': '-', '−': '-',
  '’': "'", '`': "'", '´': "'", '"': '"', "'": "'",
};

// Optional: Ortspräfix-Kombi-Regeln (nur für Translit, nicht für raw)
const prefixReplacements: Record<string, string> = {
  'г.': 'G.',
  'д.': 'D.',
  'пгт.': 'PGT.',
  'рп.': 'RP.',
  'с.': 'S.',
};

export function transliterate(text: string): string {
  let result = text;

  // Vorab: spezifische Ortspräfixe ersetzen
  for (const [key, replacement] of Object.entries(prefixReplacements)) {
    const pattern = new RegExp(`\\b${key}`, 'gi');
    result = result.replace(pattern, replacement);
  }

  // Zeichenweise Transliteration
  return result
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const isUpper = char !== lower;
      const transChar = table[lower] ?? char;
      return isUpper
        ? transChar.charAt(0).toUpperCase() + transChar.slice(1)
        : transChar;
    })
    .join('');
}
