// Sehr einfache Transliterationstabelle
const table: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd',
  е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};

export function transliterate(text: string): string {
  return text
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const isUpper = char !== lower;
      const transChar = table[lower] || char;
      return isUpper
        ? transChar.charAt(0).toUpperCase() + transChar.slice(1)
        : transChar;
    })
    .join('');
}
