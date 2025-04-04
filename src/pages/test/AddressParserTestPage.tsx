import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { parseCyrillicAddress } from "@/lib/parser/address/parseCyrillicAddress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Region = "RU" | "EU" | "GLOBAL";

export default function AddressParserTestPage() {
  const [input, setInput] = useState("");
  const [region, setRegion] = useState<Region>("RU");
  const [parsed, setParsed] = useState<any | null>(null);

  const handleParse = () => {
    let result = null;
    switch (region) {
      case "RU":
        result = parseCyrillicAddress(input);
        break;
      case "EU":
        result = { raw: input, note: "EU parsing not yet implemented." };
        break;
      case "GLOBAL":
        result = { raw: input, note: "Global parsing not yet implemented." };
        break;
    }
    setParsed(result);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">📦 Address Parser Test</h1>

      <div className="flex gap-2">
        <Button variant={region === "RU" ? "default" : "outline"} onClick={() => setRegion("RU")}>RU</Button>
        <Button variant={region === "EU" ? "default" : "outline"} onClick={() => setRegion("EU")}>EU</Button>
        <Button variant={region === "GLOBAL" ? "default" : "outline"} onClick={() => setRegion("GLOBAL")}>Global</Button>
      </div>

      <div>
        <Label htmlFor="address-input">Adresse eingeben (z. B. Copy-Paste aus E-Mail):</Label>
        <Textarea
          id="address-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="z. B. Иванов Иван Иванович, ул. Ленина, д. 10, кв. 5, Москва, 101000"
          rows={6}
        />
      </div>

      <Button onClick={handleParse}>Adresse analysieren</Button>

      {parsed && (
        <Card className="bg-muted/40 mt-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">🔍 Analyseergebnis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {Object.entries(parsed).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span> {String(value ?? "—")}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
