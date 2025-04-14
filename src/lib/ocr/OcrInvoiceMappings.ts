import { v4 as uuidv4 } from "uuid";

export const mapOcrInvoiceMapping = (result: any) => {
  const pred = result?.document?.inference?.prediction;
  return {
    invoice_number: pred?.invoice_number?.value ?? null,
    invoice_date: pred?.date?.value ?? null,
    delivery_date: pred?.delivery_date?.value ?? null,
    due_date: pred?.due_date?.value ?? null,
    payment_date: pred?.payment_date?.value ?? null,
    total_amount: pred?.total_amount?.value ?? null,
    total_tax: pred?.total_tax?.value ?? null,
    total_net: pred?.total_net?.value ?? null,
    currency: pred?.locale?.currency ?? null,
    supplier_name: pred?.supplier_name?.value ?? null,
    supplier_vat: extractRegistrationNumber(pred?.supplier_company_registrations, "VAT NUMBER"),
    supplier_address: pred?.supplier_address?.value ?? null,
    supplier_email: pred?.supplier_email?.value ?? null,
    supplier_phone: pred?.supplier_phone_number?.value ?? null,
    customer_name: pred?.customer_name?.value ?? null,
    customer_address: pred?.customer_address?.value ?? null,
    customer_vat: extractRegistrationNumber(pred?.customer_company_registrations, "VAT NUMBER"),
    po_number: pred?.po_number?.value ?? null,
    reference_number: Array.isArray(pred?.reference_numbers) && pred.reference_numbers.length > 0
      ? pred.reference_numbers[0]?.value ?? null
      : null,
    iban: extractPaymentDetails(pred?.supplier_payment_details, "iban"),
    swift: extractPaymentDetails(pred?.supplier_payment_details, "swift"),
  };
};

export const mapOcrInvoiceLineItems = (result: any) => {
  const items = result?.document?.inference?.prediction?.line_items;
  if (!Array.isArray(items)) return [];

  const mapped = items.map((item: any, index: number) => ({
    id: uuidv4(),
    item_index: index + 1,
    description: item?.description ?? "-",
    quantity: item?.quantity ?? null,
    unit_price: item?.unit_price ?? null,
    total_price: item?.total_amount ?? null,
    tax_rate: item?.tax_rate ?? null,
    product_code: item?.product_code ?? null,
  }));

  console.log("✅ [OCR DEBUG] Mapped Line Items:", mapped);

  return mapped;
};

const extractRegistrationNumber = (
  registrations: { type?: string; value?: string }[] | undefined,
  type: string
): string | null => {
  if (!Array.isArray(registrations)) return null;
  const match = registrations.find((r) => r.type === type);
  return match?.value ?? null;
};

const extractPaymentDetails = (
  details: { iban?: string; swift?: string }[] | undefined,
  key: "iban" | "swift"
): string | null => {
  if (!Array.isArray(details)) return null;
  const match = details.find((d) => d[key]);
  return match?.[key] ?? null;
};
