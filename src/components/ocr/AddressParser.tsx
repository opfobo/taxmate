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
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { saveConsumerWithAddress } from "@/lib/supabase/consumerUtils";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/client";

const ALL_FIELDS = [
  "name",
  "street",
  "house_number",
  "block",
  "kv",
  "city",
  "postal_code",
  "country",
  "phone",
  "email",
  "birthday",
  "other"
] as const;
type FieldKey = typeof ALL_FIELDS[number];
const MANDATORY_FIELDS: FieldKey[] = [
  "name",
  "street",
  "house_number",
  "city",
  "postal_code",
  "country",
  "phone"
];

export default function AddressParserTestPage() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [translitOutput, setTranslitOutput] = useState("");
  const [fields, setFields] = useState<{ key: FieldKey; value: string; isGuessed?: boolean }[]>([]);
  const [visible, setVisible] = useState(false);
  const [fieldToAdd, setFieldToAdd] = useState<FieldKey | null>(null);

  useEffect(() => {
    const transliterated = input
      .split(/\r?\n/)
      .map(line => transliterate(line.trim()))
      .filter(Boolean)
      .map(line => line.trim())
      .join(" ")
      .replace(/\s{2,}/g, " ");
    setTranslitOutput(transliterated);
  }, [input]);

  const addSpacesBetweenWords = (text: string) =>
    text.replace(/(?<=[a-z])(?=[A-Z])/g, " ");

  const capitalizeAllWords = (text: string) =>
    text.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1));

  const addField = (key: FieldKey) => {
    setFields(prev => [...prev, { key, value: "" }]);
    const newAvailable = ALL_FIELDS.filter(k => ![...fields, { key, value: "" }].some(f => f.key === k));
    setFieldToAdd(newAvailable.length > 0 ? newAvailable[0] : null);
  };

const updateField = (index: number, newValue: string) => {
  setFields(prev => {
    const copy = [...prev];
    copy[index] = { ...copy[index], value: newValue, isGuessed: false };
    return copy;
  });
};


  const changeKey = (index: number, newKey: FieldKey) => {
    setFields(prev => {
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
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      const newAvailable = ALL_FIELDS.filter(key => !newFields.some(f => f.key === key));
      setFieldToAdd(newAvailable.length > 0 ? newAvailable[0] : null);
    }
  };

  const handleSplit = async () => {
  let newFields: typeof fields = [];

  try {
    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;

    if (!accessToken) {
      throw new Error("No valid session token found");
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse_address_with_gpt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ input })
    });

    const parsed = await response.json();
    if (!parsed || parsed.error) throw new Error(parsed.error || "GPT returned nothing");

    const safeGet = (key: FieldKey) => parsed[key]?.trim?.() ?? "";

    for (const key of ALL_FIELDS) {
      const raw = safeGet(key);
      if (raw) {
        const isGuessed = raw.includes("(?)");
        const clean = raw.replace(/\(\?\)/g, "").trim();
        const final = key === "country" || key === "city" || key === "street" || key === "name"
          ? capitalizeAllWords(addSpacesBetweenWords(transliterate(clean)))
          : transliterate(clean);

        newFields.push({ key, value: final, isGuessed });
      }
    }

    const existingKeys = newFields.map(f => f.key);
    const mandatoryWithEmpty = MANDATORY_FIELDS.filter(m => !existingKeys.includes(m)).map(key => ({
      key,
      value: "",
      isGuessed: false
    }));

    const allFields = [...mandatoryWithEmpty, ...newFields];
    setFields(allFields);

    const newAvailable = ALL_FIELDS.filter(key => !allFields.some(f => f.key === key));
    setFieldToAdd(newAvailable.length > 0 ? newAvailable[0] : null);
    setVisible(true);

  } catch (e) {
    console.error("❌ GPT Adressverarbeitung fehlgeschlagen:", e);
  }
};


  const availableFields = ALL_FIELDS.filter(key => !fields.some(f => f.key === key));

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-0 px-[16px]">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        {t("consumer_title")}
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>{t("consumer_input_address")}</Label>
          <Textarea value={input} onChange={e => setInput(e.target.value)} rows={8} />
        </div>
        <div>
          <Label>{t("consumer_transliterated_output")}</Label>
          <Textarea value={translitOutput} readOnly rows={8} className="bg-muted/40" />
        </div>
      </div>

      <Button onClick={handleSplit}>{t("consumer_button_analyze")}</Button>

      {visible && (
        <Card className="bg-muted/40 mt-6">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-lg font-semibold mb-2">{t("consumer_section_assignment")}</h2>
            {fields.map((f, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Select value={f.key} onValueChange={val => changeKey(i, val as FieldKey)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue>{t(`consumer_${f.key}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_FIELDS.filter(key => !fields.some(x => x.key === key && x.key !== f.key)).map(key => (
                      <SelectItem key={key} value={key}>
                        {t(`consumer_${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
<Input
  value={f.value}
  onChange={e => updateField(i, e.target.value)}
  className={`flex-1 ${f.isGuessed ? "bg-yellow-50 border border-yellow-300" : ""}`}
/>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeField(i)}>
                  ✖
                </Button>
              </div>
            ))}

            {availableFields.length > 0 && (
              <div className="flex items-center gap-2 pt-4">
                <Select value={fieldToAdd ?? undefined} onValueChange={val => setFieldToAdd(val as FieldKey)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue>
                      {fieldToAdd ? t(`consumer_${fieldToAdd}`) : t("consumer_add_field")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(key => (
                      <SelectItem key={key} value={key}>
                        {t(`consumer_${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => fieldToAdd && addField(fieldToAdd)} disabled={!fieldToAdd}>
                  {t("consumer_button_add")}
                </Button>

                <div className="ml-auto">
                  <Button
                    onClick={async () => {
                      const consumerData: Record<string, string> = {};
                      fields.forEach(({ key, value }) => {
                        consumerData[key] = value.trim();
                      });
                      const success = await saveConsumerWithAddress(input, consumerData, t);
                      if (success) {
                        setInput("");
                        setFields([]);
                        setVisible(false);
                      }
                    }}
                  >
                    {t("consumer_button_save")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
