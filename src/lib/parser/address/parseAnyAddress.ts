import { ParsedAddress } from "./types";
import { parseCyrillicAddress } from "./parseCyrillicAddress";
import { parseLatinAddress } from "./parseLatinAddress";

export function parseAnyAddress(input: string): ParsedAddress {
  const isCyrillic = /[А-Яа-яЁё]/.test(input);
  return isCyrillic ? parseCyrillicAddress(input) : parseLatinAddress(input);
}
