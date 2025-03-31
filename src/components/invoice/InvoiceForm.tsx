
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceFormValues } from "@/lib/validators/invoice-validator";

interface InvoiceFormProps {
  formValues: InvoiceFormValues;
  setFormValues?: React.Dispatch<React.SetStateAction<InvoiceFormValues>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  formValues,
  handleInputChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input
              id="invoice_number"
              name="invoice_number"
              value={formValues.invoice_number}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="invoice_date">Invoice Date</Label>
            <Input
              id="invoice_date"
              name="invoice_date"
              type="date"
              value={formValues.invoice_date}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="supplier_name">Supplier Name</Label>
          <Input
            id="supplier_name"
            name="supplier_name"
            value={formValues.supplier_name}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="supplier_address">Supplier Address</Label>
          <Textarea
            id="supplier_address"
            name="supplier_address"
            value={formValues.supplier_address}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="supplier_vat">Supplier VAT</Label>
          <Input
            id="supplier_vat"
            name="supplier_vat"
            value={formValues.supplier_vat}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="customer_name">Customer Name</Label>
          <Input
            id="customer_name"
            name="customer_name"
            value={formValues.customer_name}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="customer_address">Customer Address</Label>
          <Textarea
            id="customer_address"
            name="customer_address"
            value={formValues.customer_address}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_amount">Total Amount</Label>
            <Input
              id="total_amount"
              name="total_amount"
              type="number"
              value={formValues.total_amount}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select 
              id="currency"
              name="currency"
              value={formValues.currency}
              onChange={handleInputChange as any}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total_net">Net Amount</Label>
            <Input
              id="total_net"
              name="total_net"
              type="number"
              value={formValues.total_net}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="total_tax">Tax Amount</Label>
            <Input
              id="total_tax"
              name="total_tax"
              type="number"
              value={formValues.total_tax}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
