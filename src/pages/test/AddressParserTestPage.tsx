// Vollständig überarbeitete Version mit festen Pflichtfeldern oben
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

// Feldtypen
const REQUIRED_FIELDS = [
  "name",
  "street",
  "house_number",
  "block",
  "postal_code",
  "phone_or_email"
] as const;

const OPTIONAL_FIELDS = [
  "city",
  "region",
  "birthday",
  "?"
] as const;

const ALL_FIELDS = [
  ...REQUIRED_FIELDS,
  ...OPTIONAL_FIELDS
] as const;

type FieldKey = typeof ALL_FIELDS[number];

const fieldIcons: Record<FieldKey, string> = {
  name: "👤 Name",
  street: "🛣️ Straße",
  house_number: "🏠 Hausnummer",
  block: "🏢 KV / Block",
  postal_code: "📦 PLZ",
  phone_or_email: "📞/📧 Telefon/E-Mail",
  city: "🌇 Stadt",
  region: "🌍 Region",
  birthday: "🎂 Geburtsdatum",
  "?": "❓ Unbekannt"
};

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [translitOutput, setTranslitOutput] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<FieldKey, string>>({
    name: "",
    street: "",
    house_number: "",
    block: "",
    postal_code: "",
    phone_or_email: "",
    city: "",
    region: "",
    birthday: "",
    "?": ""
  });

  useEffect(() => {
    const translit = input
      .split(/\r?\n/)
      .map((line) => transliterate(line.trim()))
      .join("\n");
    setTranslitOutput(translit);
  }, [input]);

  const extractPhone = (text: string) => {
    const match = text.match(/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/);
    return match ? match[0] : null;
  };

  const extractEmail = (text: string) => {
    const match = text.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
    return match ? match[0] : null;
  };

  const handleSplit = async () => {
    const phone = extractPhone(input);
    const email = extractEmail(input);
    let cleaned = input;
    if (phone) cleaned = cleaned.replace(phone, "");
    if (email) cleaned = cleaned.replace(email, "");
    cleaned = cleaned.trim();

    let parsed: Record<FieldKey, string> = {
      name: "",
      street: "",
      house_number: "",
      block: "",
      postal_code: "",
      phone_or_email: phone ?? email ?? "",
      city: "",
      region: "",
      birthday: "",
      "?": ""
    };

    try {
      const res = await fetch("https://pcgs.ru/address-api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: cleaned })
      });
      const result = await res.json();
      const s = result.structured;
      if (s) {
        parsed.name = s.name ?? "";
        parsed.street = s.street ?? "";
        parsed.house_number = s.house_number ?? "";
        parsed.block = s.block ?? "";
        parsed.postal_code = s.postal_code ?? "";
        parsed.city = s.city ?? "";
      }
    } catch (err) {
      console.error("API-Fehler:", err);
    }

    setFieldValues(parsed);
  };

  const updateField = (key: FieldKey, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">📦 Address Parser Test (interactive)</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Adresse eingeben (jede Angabe in separater Zeile):</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
          />
        </div>
        <div>
          <Label>🖘️ Automatisch transliteriert:</Label>
          <Textarea
            value={translitOutput}
            readOnly
            rows={8}
            className="bg-muted/40 cursor-text"
          />
        </div>
      </div>

      <Button onClick={handleSplit}>Zeilen analysieren</Button>

      <Card className="bg-muted/40 mt-6">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold mb-2">🔍 Analyse & Feldzuweisung</h2>

          {ALL_FIELDS.map((key, idx) => (
            <div
              key={key}
              className="flex items-center gap-3"
            >
              <div className="text-sm w-6 text-right text-muted-foreground">{idx + 1}.</div>
              <Select value={key} disabled>
                <SelectTrigger className="w-[180px]">
                  <SelectValue>{fieldIcons[key]}</SelectValue>
                </SelectTrigger>
              </Select>
              <Input
                value={fieldValues[key] ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="flex-1"
              />
              {REQUIRED_FIELDS.includes(key) ? null : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-red-100"
                  onClick={() => updateField(key, "")}
                >
                  ✖
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
