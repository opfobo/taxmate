import type { ParsedAddress } from "./types";
import { parseCyrillicAddress } from "./parseCyrillicAddress";
import { parseLatinAddress } from "./parseLatinAddress";

type ParsedAnyAddress = ParsedAddress | ReturnType<typeof parseCyrillicAddress>;

export function parseAnyAddress(input: string): ParsedAnyAddress {
  const isCyrillic = /[А-Яа-яЁё]/.test(input);
  return isCyrillic ? parseCyrillicAddress(input) : parseLatinAddress(input);
}
