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

// Typisierung für Felderkennung

type FieldKey =
  | "?"
  | "name"
  | "street"
  | "city"
  | "region"
  | "postal_code"
  | "phone"
  | "email"
  | "birthday"
  | "block"
  | "apartment"
  | "house_number";

const detectFieldType = (line: string): FieldKey => {
  const norm = line.toLowerCase();
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(line)) return "email";
  if (/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(norm)) return "phone";
  if (/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/.test(norm)) return "birthday";
  if (/^\d{6}$/.test(norm)) return "postal_code";
  if (/обл\.|область|край|респ\.|республика/.test(norm)) return "region";
  if (/^г\.?\s?[А-Яа-яё\- ]+/.test(norm) || /санкт[- ]петербург/.test(norm)) return "city";
  if (/ул\.?|улица|проспект|переулок|пр\.|пер\./.test(norm)) return "street";
  if (/кв\.?\s*\d+/i.test(norm)) return "apartment";
  if (/корпус|к\s*\d+/i.test(norm)) return "block";
  if (/д\.?\s*\d+/i.test(norm)) return "house_number";
  if (/^[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+$/.test(line)) return "name";
  return "?";
};

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [translitOutput, setTranslitOutput] = useState("");
  const [lines, setLines] = useState<
    { id: number; original: string; translit: string; type: FieldKey }[]
  >([]);

  useEffect(() => {
    const transliterated = input
      .split(/\r?\n/)
      .map((line) => transliterate(line.trim()))
      .join("\n");
    setTranslitOutput(transliterated);
  }, [input]);

  const handleSplit = async () => {
    let detectedFields: typeof lines = [];

    const extractPhone = (text: string) => {
      const match = text.match(/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/);
      return match ? match[0] : null;
    };

    const extractEmail = (text: string) => {
      const match = text.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
      return match ? match[0] : null;
    };

    const phone = extractPhone(input);
    const email = extractEmail(input);

    let cleanedInput = input;
    if (phone) cleanedInput = cleanedInput.replace(phone, "");
    if (email) cleanedInput = cleanedInput.replace(email, "");
    cleanedInput = cleanedInput.trim();

    try {
      const res = await fetch("https://pcgs.ru/address-api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: cleanedInput }),
      });
      const result = await res.json();
      const s = result.structured;

      let id = 0;
      if (s?.street) detectedFields.push({ id: id++, original: s.street, translit: transliterate(s.street), type: "street" });
      if (s?.house_number) detectedFields.push({ id: id++, original: s.house_number, translit: transliterate(s.house_number), type: "house_number" });
      if (s?.block) detectedFields.push({ id: id++, original: s.block, translit: transliterate(s.block), type: "block" });
      if (s?.apartment) detectedFields.push({ id: id++, original: s.apartment, translit: transliterate(s.apartment), type: "apartment" });
      if (s?.city) detectedFields.push({ id: id++, original: s.city, translit: transliterate(s.city), type: "city" });
      if (s?.postal_code) detectedFields.push({ id: id++, original: s.postal_code, translit: transliterate(s.postal_code), type: "postal_code" });
      if (s?.name) detectedFields.push({ id: id++, original: s.name, translit: transliterate(s.name), type: "name" });

      if (phone) detectedFields.push({ id: id++, original: phone, translit: phone, type: "phone" });
      if (email) detectedFields.push({ id: id++, original: email, translit: email, type: "email" });

      setLines(detectedFields);
    } catch (e) {
      console.error("Fehler bei address-api:", e);
    }
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

  const handleDeleteLine = (id: number) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddField = () => {
    const newId = lines.length > 0 ? Math.max(...lines.map((l) => l.id)) + 1 : 0;
    setLines((prev) => [
      ...prev,
      {
        id: newId,
        original: "",
        translit: "",
        type: "?",
      },
    ]);
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
            placeholder={`г. Москва\nул. Ленина 12\n101000\nИванов Иван Иванович\n+7 912 345 67 89\nivanov@mail.ru`}
            rows={8}
          />
        </div>

        <div>
          <Label htmlFor="translit-output">🖘️ Automatisch transliteriert:</Label>
          <Textarea
            id="translit-output"
            value={translitOutput}
            readOnly
            rows={8}
            className="bg-muted/40 cursor-text"
          />
        </div>
      </div>

      <Button onClick={handleSplit}>Zeilen analysieren</Button>

      {lines.length > 0 && (
        <>
          <Card className="bg-muted/40 mt-6">
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold mb-2">
                🔍 Analyse & Feldzuweisung
              </h2>
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="flex flex-col md:flex-row gap-3 items-start md:items-center"
                >
                  <span className="w-5 text-right text-sm text-muted-foreground">{index + 1}.</span>
                  <Select
                    value={line.type}
                    onValueChange={(val) =>
                      handleTypeChange(line.id, val as FieldKey)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Typ wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="?">❓ Unbekannt</SelectItem>
                      <SelectItem value="name">👤 Name</SelectItem>
                      <SelectItem value="street">🚧 Straße</SelectItem>
                      <SelectItem value="house_number">🏠 Hausnummer</SelectItem>
                      <SelectItem value="block">🏢 Block</SelectItem>
                      <SelectItem value="apartment">🏬 KV</SelectItem>
                      <SelectItem value="city">🌇 Stadt</SelectItem>
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
                    onChange={(e) =>
                      handleTranslitChange(line.id, e.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-red-100"
                    onClick={() => handleDeleteLine(line.id)}
                  >
                    ✖
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddField}>
                ➕ Neues Feld hinzufügen
              </Button>
            </CardContent>
          </Card>

          <div className="pt-4 space-y-2 text-sm text-muted-foreground">
            <p>📜 Pflichtfelder für Speicherung:</p>
            <ul className="list-disc list-inside pl-2">
              <li>👤 <strong>Name</strong></li>
              <li>🚧 <strong>Straße</strong></li>
              <li>🏠 <strong>Hausnummer</strong></li>
              <li>📬 <strong>KV / Block</strong></li>
              <li>📦 <strong>PLZ</strong></li>
              <li>📞 <strong>Telefon</strong> <em>(Pflicht)</em> oder 📧 <strong>E-Mail</strong></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
