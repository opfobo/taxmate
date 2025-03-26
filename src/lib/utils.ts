
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "EUR"): string {
  if (amount === null || amount === undefined) return "-";
  
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency
  }).format(numericAmount);
}
