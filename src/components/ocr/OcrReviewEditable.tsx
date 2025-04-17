import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const EditableText = ({
  value,
  onChange,
  isEditing,
  placeholder = "-",
}: {
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  isEditing: boolean;
  placeholder?: string;
}) => {
  return isEditing ? (
    <Input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm"
    />
  ) : (
    <div>{value ?? placeholder}</div>
  );
};

export const EditableCurrency = ({
  value,
  onChange,
  isEditing,
  placeholder = "-",
}: {
  value: number | null | undefined;
  onChange: (val: number) => void;
  isEditing: boolean;
  placeholder?: string;
}) => {
  return isEditing ? (
    <Input
      type="number"
      value={value?.toString() ?? ""}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="text-sm"
    />
  ) : (
    <div>{typeof value === "number" ? value.toFixed(2) : placeholder}</div>
  );
};

export const TaxRateSelector = ({
  value,
  onChange,
  isEditing,
}: {
  value: number | null | undefined;
  onChange: (val: number) => void;
  isEditing: boolean;
}) => {
  const rates = [0, 7, 19];

  return isEditing ? (
    <Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
      <SelectTrigger className="text-sm h-8">
        <SelectValue placeholder="Tax Rate" />
      </SelectTrigger>
      <SelectContent>
        {rates.map((r) => (
          <SelectItem key={r} value={r.toString()}>
            {r}%
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <div>{value != null ? `${value}%` : "-"}</div>
  );
};
