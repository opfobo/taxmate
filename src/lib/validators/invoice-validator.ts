
import { z } from "zod";

export const invoiceFormSchema = z.object({
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(), // Kann später zu .refine(...) gemacht werden für Date-Check
  supplier_name: z.string().optional(),
  supplier_address: z.string().optional(),
  supplier_vat: z.string().optional(),
  customer_name: z.string().optional(),
  customer_address: z.string().optional(),
  total_amount: z.string().min(1, "Required").refine((val) => parseFloat(val) >= 0, {
    message: "Must be >= 0"
  }),
  total_tax: z.string().min(1, "Required").refine((val) => parseFloat(val) >= 0, {
    message: "Must be >= 0"
  }),
  total_net: z.string().min(1, "Required").refine((val) => parseFloat(val) >= 0, {
    message: "Must be >= 0"
  }),
  currency: z.enum(["EUR", "USD", "GBP"]).default("EUR")
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
