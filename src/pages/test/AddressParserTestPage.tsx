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

const fieldOrder = [
  "name",
  "street",
  "house_number",
  "block",
  "kv",
  "city",
  "postal_code",
  "phone",
  "email",
] as const;

const fieldLabels: Record<string, string> = {
  name: "👤 Name",
  street: "🚧 Straße",
  house_number: "🏠 Hausnummer",
  block: "🏢 Block",
  kv: "📮 KV",
  city: "🌆 Stadt",
  postal_code: "📦 PLZ",
  phone: "📞 Telefon",
  email: "📧 E-Mail",
};

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [translitOutput, setTranslitOutput] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    const transliterated = input
      .split(/\r?\n/)
      .map((line) => transliterate(line.trim()))
      .join("\n");
    setTranslitOutput(transliterated);
  }, [input]);

  const extractExtras = (text: string) => {
    const phone = (text.match(/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/) || [])[0];
    const email = (text.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i) || [])[0];
    let cleaned = text;
    if (phone) cleaned = cleaned.replace(phone, "");
    if (email) cleaned = cleaned.replace(email, "");
    return { phone, email, cleaned: cleaned.trim() };
  };

  const handleParse = async () => {
    const { phone, email, cleaned } = extractExtras(input);

    const res = await fetch("https://pcgs.ru/address-api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: cleaned }),
    });

    const result = await res.json();
    const s = result.structured;

    const updatedFields: Record<string, string> = {
      name: s.name || "",
      street: s.street || "",
      house_number: s.house_number || "",
      block: s.block || "",
      kv: s.kv || "",
      city: s.city || "",
      postal_code: s.postal_code || "",
      phone: phone || "",
      email: email || "",
    };

    const translitFields: Record<string, string> = {};
    for (const key of Object.keys(updatedFields)) {
      translitFields[key] = transliterate(updatedFields[key] || "");
    }

    setFields(translitFields);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddField = (key: string) => {
    if (!(key in fields)) {
      setFields((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleDeleteField = (key: string) => {
    setFields((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        📦 Address Parser Test (interactive)
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address-input">
            Adresse eingeben (jede Angabe in separater Zeile):
          </Label>
          <Textarea
            id="address-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
          />
        </div>

        <div>
          <Label htmlFor="translit-output">🗘️ Automatisch transliteriert:</Label>
          <Textarea
            id="translit-output"
            value={translitOutput}
            readOnly
            rows={8}
            className="bg-muted/40 cursor-text"
          />
        </div>
      </div>

      <Button onClick={handleParse}>Zeilen analysieren</Button>

      <Card className="bg-muted/40 mt-6">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold mb-2">
            🔍 Analyse & Feldzuweisung
          </h2>
          {fieldOrder.map((key, index) => (
            <div key={key} className="flex items-center gap-4">
              <div className="w-6 text-muted-foreground">{index + 1}.</div>
              <Label className="w-[180px] text-muted-foreground">{fieldLabels[key]}</Label>
              <Input
                value={fields[key] || ""}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
              {!["name", "street", "house_number", "city", "postal_code", "phone"].includes(key) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-red-100"
                  onClick={() => handleDeleteField(key)}
                >
                  ✖
                </Button>
              )}
            </div>
          ))}
          <div>
            <Label className="block mb-1 text-sm">➕ Feld hinzufügen:</Label>
            <div className="flex flex-wrap gap-2">
              {fieldOrder.map(
                (key) =>
                  !(key in fields) && (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField(key)}
                    >
                      {fieldLabels[key]}
                    </Button>
                  )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
