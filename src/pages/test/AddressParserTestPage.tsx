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
import { ChevronDown } from "lucide-react";

const ALL_FIELDS = [
  "name",
  "street",
  "house_number",
  "block",
  "kv",
  "city",
  "postal_code",
  "phone",
  "email",
  "birthday",
  "other",
] as const;
type FieldKey = typeof ALL_FIELDS[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  name: "👤 Name",
  street: "🛣️ Straße",
  house_number: "🏡 Hausnummer",
  block: "🏢 Block",
  kv: "📮 KV",
  city: "🌇 Stadt",
  postal_code: "📦 PLZ",
  phone: "📞 Telefon",
  email: "📧 E-Mail",
  birthday: "🎂 Geburtsdatum",
  other: "📝 Sonstiges",
};

const MANDATORY_FIELDS: FieldKey[] = [
  "name",
  "street",
  "house_number",
  "city",
  "postal_code",
  "phone",
];

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [translitOutput, setTranslitOutput] = useState("");
  const [fields, setFields] = useState<{ key: FieldKey; value: string }[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const transliterated = input
      .split(/\r?\n/)
      .map((line) => transliterate(line.trim()))
      .join("\n");
    setTranslitOutput(transliterated);
  }, [input]);

  const addSpacesBetweenWords = (text: string) => {
    return text.replace(/(?<=[a-z])(?=[A-Z])/g, " ");
  };

  const capitalizeAllWords = (text: string) => {
    return text.replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1));
  };

  const addField = (key: FieldKey) => {
    setFields((prev) => [...prev, { key, value: "" }]);
  };

  const updateField = (index: number, newValue: string) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index].value = newValue;
      return copy;
    });
  };

  const changeKey = (index: number, newKey: FieldKey) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index].key = newKey;
      return copy;
    });
  };

  const removeField = (index: number) => {
    const field = fields[index];
    if (MANDATORY_FIELDS.includes(field.key)) {
      updateField(index, "");
    } else {
      setFields((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSplit = async () => {
    let detected: typeof fields = [];
    let cleanedInput = input.trim();

    const phoneMatch = cleanedInput.match(/(?:\+7|8)?[\s-]?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/);
    const emailMatch = cleanedInput.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);

    if (phoneMatch) cleanedInput = cleanedInput.replace(phoneMatch[0], "");
    if (emailMatch) cleanedInput = cleanedInput.replace(emailMatch[0], "");

    let newFields: typeof fields = [];

    try {
      const res = await fetch("https://pcgs.ru/address-api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: cleanedInput }),
      });
      const result = await res.json();
      const s = result.structured;

      if (s.name) newFields.push({ key: "name", value: capitalizeAllWords(addSpacesBetweenWords(transliterate(s.name))) });
      if (s.street) newFields.push({ key: "street", value: capitalizeAllWords(addSpacesBetweenWords(transliterate(s.street))) });
      if (s.house_number) newFields.push({ key: "house_number", value: addSpacesBetweenWords(transliterate(s.house_number)) });
      if (s.block) newFields.push({ key: "block", value: addSpacesBetweenWords(transliterate(s.block)) });
      if (s.kv) newFields.push({ key: "kv", value: addSpacesBetweenWords(transliterate(s.kv)) });
      if (s.city) newFields.push({ key: "city", value: capitalizeAllWords(addSpacesBetweenWords(transliterate(s.city))) });
      if (s.postal_code) newFields.push({ key: "postal_code", value: transliterate(s.postal_code) });
    } catch (e) {
      console.error("API Fehler:", e);
    }

    if (phoneMatch) detected.push({ key: "phone", value: phoneMatch[0] });
    if (emailMatch) detected.push({ key: "email", value: emailMatch[0] });

    const existingKeys = [...newFields, ...detected].map((f) => f.key);
    const mandatoryWithEmpty = MANDATORY_FIELDS.filter((m) => !existingKeys.includes(m))
      .map((key) => ({ key, value: "" }));

    setFields([...mandatoryWithEmpty, ...newFields, ...detected]);
    setVisible(true);
  };

  const availableFields = ALL_FIELDS.filter(
    (key) => !fields.some((f) => f.key === key)
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        📦 Address Parser Test (interactive)
      </h1>

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
          <Textarea
            value={translitOutput}
            readOnly
            rows={8}
            className="bg-muted/40"
          />
        </div>
      </div>

      <Button onClick={handleSplit}>Zeilen analysieren</Button>

      {visible && (
        <Card className="bg-muted/40 mt-6">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold mb-2">🔍 Analyse & Feldzuweisung</h2>
            {fields.map((f, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Select value={f.key} onValueChange={(val) => changeKey(i, val as FieldKey)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={FIELD_LABELS[f.key]} />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_FIELDS.filter((key) => !fields.some((x) => x.key === key && x.key !== f.key)).map((key) => (
                      <SelectItem key={key} value={key}>
                        {FIELD_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={f.value}
                  onChange={(e) => updateField(i, e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeField(i)}
                >
                  ✖
                </Button>
              </div>
            ))}
            {availableFields.length > 0 && (
              <Select onValueChange={(val) => addField(val as FieldKey)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="+ Feld hinzufügen" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((key) => (
                    <SelectItem key={key} value={key}>
                      {FIELD_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
