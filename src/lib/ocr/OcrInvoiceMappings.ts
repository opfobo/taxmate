// src/lib/ocr/OcrInvoiceMappings.ts

export const mapOcrInvoiceMapping = (response: any) => {
  const p = response?.document?.inference?.prediction;

  return {
    invoice_number: p?.invoice_number?.value ?? null,
    invoice_date: p?.date?.value ?? null,
    delivery_date: p?.delivery_date?.value ?? null,
    due_date: p?.due_date?.value ?? null,
    payment_date: p?.payment_date?.value ?? null,
    supplier_name: p?.supplier?.name?.value ?? null,
    supplier_address: p?.supplier?.address?.value ?? null,
    supplier_vat: p?.supplier?.vat_number?.value ?? null,
    supplier_email: p?.supplier?.email?.value ?? null,
    supplier_phone: p?.supplier?.phone_number?.value ?? null,
    customer_name: p?.customer?.name?.value ?? null,
    customer_address: p?.customer?.address?.value ?? null,
    customer_vat: p?.customer?.vat_number?.value ?? null,
    total_amount: p?.total_incl?.value ?? null,
    total_tax: p?.total_tax?.value ?? null,
    total_net: p?.total_excl?.value ?? null,
    currency: p?.locale?.currency?.value ?? "EUR",
    po_number: p?.purchase_order_number?.value ?? null,
    reference_number: p?.reference_number?.value ?? null,
    iban: p?.iban?.value ?? null,
    swift: p?.swift?.value ?? null,
  };
};

export const mapOcrInvoiceLineItems = (response: any) => {
  const items = response?.document?.inference?.prediction?.line_items ?? [];

  return items.map((item: any, index: number) => ({
    id: crypto.randomUUID(),
    item_index: index + 1,
    description: item?.description?.value ?? "-",
    product_code: item?.product_code?.value ?? null,
    quantity: item?.quantity?.value ?? null,
    unit_price: item?.unit_price?.value ?? null,
    total_price: item?.total_amount?.value ?? null,
    tax_rate: item?.tax_rate?.value ?? null,
    created_at: new Date().toISOString(),
  }));
};

