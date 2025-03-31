
import React from "react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceFormValues } from "@/lib/validators/invoice-validator";

interface InvoiceFormProps {
  formValues: InvoiceFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<InvoiceFormValues>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  formValues,
  setFormValues,
  handleInputChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Invoice Details</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <FormLabel>Invoice Number</FormLabel>
          <Input
            name="invoice_number"
            value={formValues.invoice_number || ""}
            onChange={handleInputChange}
            placeholder="Invoice #"
          />
        </div>
        <div>
          <FormLabel>Invoice Date</FormLabel>
          <Input
            type="date"
            name="invoice_date"
            value={formValues.invoice_date || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <FormLabel>Supplier Name</FormLabel>
          <Input
            name="supplier_name"
            value={formValues.supplier_name || ""}
            onChange={handleInputChange}
            placeholder="Supplier name"
          />
        </div>

        <div>
          <FormLabel>Supplier VAT</FormLabel>
          <Input
            name="supplier_vat"
            value={formValues.supplier_vat || ""}
            onChange={handleInputChange}
            placeholder="VAT ID"
          />
        </div>

        <div>
          <FormLabel>Supplier Address</FormLabel>
          <Textarea
            name="supplier_address"
            value={formValues.supplier_address || ""}
            onChange={handleInputChange}
            placeholder="Supplier address"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <FormLabel>Customer Name</FormLabel>
          <Input
            name="customer_name"
            value={formValues.customer_name || ""}
            onChange={handleInputChange}
            placeholder="Customer name"
          />
        </div>

        <div>
          <FormLabel>Customer Address</FormLabel>
          <Textarea
            name="customer_address"
            value={formValues.customer_address || ""}
            onChange={handleInputChange}
            placeholder="Customer address"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <FormLabel>Total Amount</FormLabel>
          <Input
            type="number"
            step="0.01"
            name="total_amount"
            value={formValues.total_amount || "0"}
            onChange={handleInputChange}
            min="0"
          />
        </div>
        <div>
          <FormLabel>Total Tax</FormLabel>
          <Input
            type="number"
            step="0.01"
            name="total_tax"
            value={formValues.total_tax || "0"}
            onChange={handleInputChange}
            min="0"
          />
        </div>
        <div>
          <FormLabel>Currency</FormLabel>
          <Select
            value={formValues.currency}
            onValueChange={(value) => 
              setFormValues({
                ...formValues,
                currency: value as "EUR" | "USD" | "GBP"
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
