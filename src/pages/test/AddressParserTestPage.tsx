// --- IMPORTS ---
"use client";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { transliterate } from "@/lib/parser/address/transliteration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// --- TYPE DEF ---
type FieldKey =
  | "name"
  | "street"
  | "house_number"
  | "block"
  | "kv"
  | "city"
  | "postal_code"
  | "phone"
  | "email"
  | "birthday"
  | "other";

const FIELD_ICONS: Record<FieldKey, string> = {
  name: "👤",
  street: "🚧",
  house_number: "🏠",
  block: "🏢",
  kv: "📮",
  city: "🌆",
  postal_code: "📦",
  phone: "📞",
  email: "📧",
  birthday: "🎂",
  other: "❓",
};

const detectFieldType = (line: string): FieldKey => {
  const norm = line.toLowerCase();
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(line)) return "email";
  if (/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(norm)) return "phone";
  if (/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/.test(norm)) return "birthday";
  if (/^\d{6}$/.test(norm)) return "postal_code";
  if (/ул\.|улица|проспект|переулок/.test(norm)) return "street";
  if (/г\.|город|санкт/.test(norm)) return "city";
  if (/^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/.test(line)) return "name";
  return "other";
};

const mandatoryFields: FieldKey[] = [
  "name",
  "street",
  "house_number",
  "city",
  "postal_code",
  "phone",
];
const optionalFields: FieldKey[] = ["block", "kv", "email", "birthday", "other"];

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [translitOutput, setTranslitOutput] = useState("");
  const [fields, setFields] = useState<{ key: FieldKey; value: string }[]>([]);

  useEffect(() => {
    const transliterated = transliterate(input.trim());
    setTranslitOutput(transliterated);
  }, [input]);

  const handleSplit = async () => {
    const phone = input.match(/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/)?.[0];
    const email = input.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
    let cleaned = input;
    if (phone) cleaned = cleaned.replace(phone, "");
    if (email) cleaned = cleaned.replace(email, "");

    try {
      const res = await fetch("https://pcgs.ru/address-api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: cleaned.trim() }),
      });
      const result = await res.json();
      const s = result.structured;

      const parsed: { key: FieldKey; value: string }[] = [];
      if (s.name) parsed.push({ key: "name", value: transliterate(s.name) });
      if (s.street) parsed.push({ key: "street", value: transliterate(s.street) });
      if (s.house_number) parsed.push({ key: "house_number", value: s.house_number });
      if (s.city) parsed.push({ key: "city", value: transliterate(s.city) });
      if (s.postal_code) parsed.push({ key: "postal_code", value: s.postal_code });
      if (phone) parsed.push({ key: "phone", value: phone });
      if (email) parsed.push({ key: "email", value: email });

      const ensured = [...mandatoryFields, ...optionalFields]
        .filter((key) => !parsed.some((f) => f.key === key))
        .map((key) => ({ key, value: "" }));

      setFields([...parsed, ...ensured]);
    } catch (e) {
      console.error("Fehler bei address-api:", e);
    }
  };

  const handleUpdate = (index: number, value: string) => {
    const updated = [...fields];
    updated[index].value = value;
    setFields(updated);
  };

  const handleAddField = (key: FieldKey) => {
    if (fields.some((f) => f.key === key)) return;
    setFields((prev) => [...prev, { key, value: "" }]);
  };

  const handleDelete = (index: number) => {
    const f = fields[index];
    if (mandatoryFields.includes(f.key)) {
      handleUpdate(index, "");
    } else {
      setFields((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const availableToAdd = optionalFields.filter((k) => !fields.some((f) => f.key === k));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">📦 Address Parser Test (interactive)</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Adresse eingeben:</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
          />
        </div>
        <div>
          <Label>🖘️ Automatisch transliteriert:</Label>
          <Textarea value={translitOutput} readOnly rows={8} className="bg-muted/40" />
        </div>
      </div>
      <Button onClick={handleSplit}>Zeilen analysieren</Button>

      <Card className="bg-muted/40 mt-6">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">🔍 Analyse & Feldzuweisung</h2>
          {fields.map((field, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <Select value={field.key} disabled>
                <SelectTrigger className="w-[180px]">
                  <SelectValue>{FIELD_ICONS[field.key]} {field.key}</SelectValue>
                </SelectTrigger>
              </Select>
              <Input
                value={field.value}
                onChange={(e) => handleUpdate(idx, e.target.value)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(idx)}
                className="text-destructive"
              >✖</Button>
            </div>
          ))}
          {availableToAdd.length > 0 && (
            <div className="pt-2">
              <Select onValueChange={(val) => handleAddField(val as FieldKey)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="+ Feld hinzufügen" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((key) => (
                    <SelectItem key={key} value={key}>
                      {FIELD_ICONS[key]} {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
