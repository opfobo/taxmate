// src/lib/parser/address/regexRouter.ts

import { regexRussia } from "./regexRussia";
import { regexEurope } from "./regexEurope";
import { regexGlobal } from "./regexGlobal";

export const detectRegexByContent = (input: string) => {
  if (/[А-Яа-яЁё]/.test(input)) return regexRussia;
  if (/[A-Za-z]/.test(input)) return regexEurope;
  return regexGlobal;
};
