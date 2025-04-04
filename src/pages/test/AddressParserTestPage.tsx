// src/pages/test/AddressParserInteractivePage.tsx
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transliterate } from "@/lib/parser/address/transliteration";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const FIELD_OPTIONS = [
  { value: "name", label: "Name", icon: "👤" },
  { value: "phone", label: "Telefon", icon: "📞" },
  { value: "email", label: "E-Mail", icon: "📷" },
  { value: "birthday", label: "Geburtsdatum", icon: "🎂" },
  { value: "street", label: "Straße", icon: "🛣️" },
  { value: "city", label: "Stadt", icon: "🏙️" },
  { value: "postal_code", label: "PLZ", icon: "🏷️" },
  { value: "region", label: "Region", icon: "🌍" },
  { value: "unknown", label: "Unbekannt", icon: "❓" },
];

type LineField = {
  id: number;
  raw: string;
  translit: string;
  type: string;
};

let idCounter = 1;

export default function AddressParserInteractivePage() {
  const [input, setInput] = useState("");
  const [fields, setFields] = useState<LineField[]>([]);

  const guessType = (line: string): string => {
    const lower = line.toLowerCase();
    if (/\+?7|8\d{10}/.test(lower)) return "phone";
    if (/@/.test(lower)) return "email";
    if (/\d{2}[./-]\d{2}[./-]\d{2,4}/.test(lower)) return "birthday";
    if (/[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/.test(line)) return "name";
    if (/ул\.|улица|проспект|пер\.|переулок/.test(lower)) return "street";
    if (/г\.\s?[А-Яа-яё]+/.test(lower)) return "city";
    if (/область|республика|край/.test(lower)) return "region";
    if (/^\d{6}$/.test(lower)) return "postal_code";
    return "unknown";
  };

  const handleParse = () => {
    const lines = input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const mapped = lines.map((line) => ({
      id: idCounter++,
      raw: line,
      translit: transliterate(line),
      type: guessType(line),
    }));

    setFields(mapped);
  };

  const handleTypeChange = (id: number, newType: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type: newType } : f))
    );
  };

  const handleTranslitChange = (id: number, newValue: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, translit: newValue } : f))
    );
  };

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: idCounter++,
        raw: "",
        translit: "",
        type: "unknown",
      },
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">📦 Address Parser Test (Interactive)</h1>

      <div>
        <Label htmlFor="address-input">Adresse eingeben (jede Angabe in separater Zeile):</Label>
        <Textarea
          id="address-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder="z. B. Иванов Иван Иванович\n+79123456789\nexample@mail.ru\n01.01.1990\nг. Москва, ул. Ленина, д. 10"
        />
      </div>

      <Button onClick={handleParse}>Zeilen analysieren</Button>

      {fields.length > 0 && (
        <Card className="bg-muted/40 mt-6">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold mb-2">🔍 Analyse & Feldzuweisung</h2>

            {fields.map((field) => (
              <div key={field.id} className="flex gap-2 items-center">
                <Select
                  value={field.type}
                  onValueChange={(val) => handleTypeChange(field.id, val)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={field.translit}
                  onChange={(e) => handleTranslitChange(field.id, e.target.value)}
                />
              </div>
            ))}

            <Button variant="outline" onClick={handleAddField}>
              ➕ Neues Feld hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
