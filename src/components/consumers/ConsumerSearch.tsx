import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Consumer } from "@/types/consumer";
import { useTranslation } from "@/hooks/useTranslation";

interface ConsumerSearchProps {
  onSelect: (consumer: Consumer) => void;
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
}

const ConsumerSearch = ({
  onSelect,
  defaultValue = "",
  autoFocus = false,
  className = "",
}: ConsumerSearchProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [results, setResults] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConsumers = async () => {
      if (searchQuery.trim() === "") {
        setResults([]);
        return;
      }
      setLoading(true);
      const query = supabase
        .from("consumers")
        .select("*")
        .or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,postal_code.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        )
        .order("created_at", { ascending: false });
      const { data, error } = await query;
      if (!error) setResults(data ?? []);
      setLoading(false);
    };

    const debounce = setTimeout(fetchConsumers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={t("search_consumers")}
        className="pl-9"
        value={searchQuery}
        autoFocus={autoFocus}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <div className="absolute z-50 bg-background mt-1 rounded-md border shadow-md w-full max-h-60 overflow-auto">
          {loading ? (
            <div className="p-2 text-sm text-muted-foreground">{t("loading")}...</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">{t("no_results")}</div>
          ) : (
            results.map((consumer) => (
              <div
                key={consumer.id}
                className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => {
                  onSelect(consumer);
                  setSearchQuery(consumer.full_name);
                }}
              >
                {consumer.full_name} ({consumer.email})
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConsumerSearch;
