// src/pages/test/address.tsx
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { transliterate } from "@/lib/parser/address/transliteration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type FieldKey = "?" | "name" | "street" | "city" | "region" | "postal_code" | "phone" | "email" | "birthday";

const detectFieldType = (line: string): FieldKey => {
  const norm = line.toLowerCase();
  if (/[\w.-]+@[\w.-]+\.[a-z]{2,}/i.test(line)) return "email";
  if (/(?:\+7|8)?[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/.test(norm)) return "phone";
  if (/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/.test(norm)) return "birthday";
  if (/^\d{6}$/.test(norm)) return "postal_code";
  if (/обл\.|область|край|респ\.|республика/.test(norm)) return "region";
  if (/^г\.\s?[А-Яа-яё\- ]+/.test(norm) || /санкт[- ]петербург/.test(norm)) return "city";
  if (/ул\.?|улица|проспект|переулок|пр\.|пер\./.test(norm)) return "street";
  if (/^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/.test(line)) return "name";
  return "?";
};

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<
    { id: number; original: string; translit: string; type: FieldKey }[]
  >([]);

  const handleSplit = () => {
    const splitLines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const structured = splitLines.map((line, idx) => ({
      id: idx,
      original: line,
      translit: transliterate(line),
      type: detectFieldType(line),
    }));

    setLines(structured);
  };

  const handleTypeChange = (id: number, newType: FieldKey) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, type: newType } : l))
    );
  };

  const handleTranslitChange = (id: number, newText: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, translit: newText } : l))
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
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        📦 Address Parser Test (interactive)
      </h1>

      <div>
        <Label htmlFor="address-input">
          Adresse eingeben (jede Angabe in separater Zeile):
        </Label>
        <Textarea
          id="address-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`г. Москва\nул. Ленина 12\nкв. 5\n101000\nИванов Иван Иванович\n+7 912 345 67 89\nivanov@mail.ru`}
          rows={8}
        />
      </div>

      <Button onClick={handleSplit}>Zeilen analysieren</Button>

      {lines.length > 0 && (
        <Card className="bg-muted/40 mt-6">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold mb-2">🔍 Analyse & Feldzuweisung</h2>
            {lines.map((line) => (
              <div
                key={line.id}
                className="flex flex-col md:flex-row gap-3 items-start md:items-center"
              >
                <Select
                  value={line.type}
                  onValueChange={(val) => handleTypeChange(line.id, val as FieldKey)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Typ wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="?">❓ Unbekannt</SelectItem>
                    <SelectItem value="name">👤 Name</SelectItem>
                    <SelectItem value="street">🛣️ Straße</SelectItem>
                    <SelectItem value="city">🏙️ Stadt</SelectItem>
                    <SelectItem value="region">🌍 Region</SelectItem>
                    <SelectItem value="postal_code">📦 PLZ</SelectItem>
                    <SelectItem value="phone">📞 Telefon</SelectItem>
                    <SelectItem value="email">📧 E-Mail</SelectItem>
                    <SelectItem value="birthday">🎂 Geburtsdatum</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={line.translit}
                  className="flex-1"
                  onChange={(e) => handleTranslitChange(line.id, e.target.value)}
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
