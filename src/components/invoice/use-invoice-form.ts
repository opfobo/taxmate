
import { useState, useCallback } from "react";
import { InvoiceFormValues } from "@/lib/validators/invoice-validator";

export const useInvoiceForm = () => {
  const [formValues, setFormValues] = useState<InvoiceFormValues>({
    invoice_number: "",
    invoice_date: "",
    supplier_name: "",
    supplier_address: "",
    supplier_vat: "",
    customer_name: "",
    customer_address: "",
    total_amount: "0",
    total_tax: "0",
    total_net: "0",
    currency: "EUR"
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormValues({
      invoice_number: "",
      invoice_date: "",
      supplier_name: "",
      supplier_address: "",
      supplier_vat: "",
      customer_name: "",
      customer_address: "",
      total_amount: "0",
      total_tax: "0",
      total_net: "0",
      currency: "EUR"
    });
  }, []);

  return {
    formValues,
    setFormValues,
    handleInputChange,
    resetForm
  };
};
