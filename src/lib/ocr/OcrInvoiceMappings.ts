// src/lib/ocr/OcrInvoiceMappings.ts

export const mapOcrInvoiceMapping = (response: any) => {
  const p = response?.document?.inference?.prediction;

  return {
    invoice_number: p?.invoice_number?.value ?? '',
    invoice_date: p?.invoice_date?.value ?? null,
    delivery_date: p?.delivery_date?.value ?? null,
    due_date: p?.due_date?.value ?? null,
    payment_date: p?.payment_date?.value ?? null,
    currency: p?.locale?.value?.currency ?? 'EUR',

    total_amount: p?.total_amount?.value ?? null,
    total_tax: p?.taxes?.[0]?.value ?? null,
    total_net: p?.total_net?.value ?? null,

    supplier_name: p?.supplier?.name?.value ?? '',
    supplier_address_raw: p?.supplier?.address?.value ?? '',
    supplier_vat: p?.supplier?.company_registrations?.[0]?.value ?? '',
    supplier_email: p?.supplier?.email?.value ?? '',
    supplier_phone: p?.supplier?.phone_number?.value ?? '',
    iban: p?.payment_details?.iban?.value ?? '',
    swift: p?.payment_details?.swift?.value ?? '',

    customer_name: p?.customer?.name?.value ?? '',
    customer_address_raw: p?.customer?.address?.value ?? '',
    customer_vat: p?.customer?.company_registrations?.[0]?.value ?? '',

    po_number: p?.purchase_order_number?.value ?? '',
    reference_number: p?.reference_number?.value ?? '',
  };
};

export const mapOcrInvoiceLineItems = (response: any) => {
  const items = response?.document?.inference?.prediction?.line_items ?? [];

  return items.map((item: any, index: number) => ({
    item_index: index + 1,
    description: item?.description?.value ?? '',
    product_code: item?.product_code?.value ?? '',
    quantity: item?.quantity?.value ?? null,
    unit_price: item?.unit_price?.value ?? null,
    total_price: item?.total_amount?.value ?? null,
    tax_rate: item?.tax_rate?.value ?? null,
  }));
};
