
import { parseLatinAddress } from "./parseLatinAddress";
import { parseCyrillicAddress } from "./parseCyrillicAddress";
import { ParsedAddress } from "../../types/parsedAddress";

export function parseAnyAddress(fullAddress: string): ParsedAddress {
  const isCyrillic = /[а-яА-ЯёЁ]/.test(fullAddress);
  
  if (isCyrillic) {
    const result = parseCyrillicAddress(fullAddress) as unknown as ParsedAddress;
    return result;
  } else {
    return parseLatinAddress(fullAddress);
  }
}
