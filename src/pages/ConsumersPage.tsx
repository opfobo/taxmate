
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import ConsumersTable from "@/components/consumers/ConsumersTable";
import ConsumerDetailsDrawer from "@/components/consumers/ConsumerDetailsDrawer";
import ConsumerForm from "@/components/consumers/ConsumerForm";
import { ConsumerWithOrderStats } from "@/types/consumer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

type ConsumerOrderStats = {
  id: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  region?: string;
  city?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
  total_orders: number;
  last_order_date: string | null;
  total_order_volume: number;
};

const ConsumersPage = () => {
  const { t } = useTranslation();
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerWithOrderStats | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const isTabMode = location.pathname.startsWith("/dashboard/orders/");
  const activeFilterCount = searchQuery.trim().length > 0 ? 1 : 0;

  const fetchConsumers = async (): Promise<ConsumerWithOrderStats[]> => {
    try {
      let query = supabase
        .from("consumers")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery.length > 2) {
        query = query.ilike("full_name", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading consumers:", error);
        return [];
      }

      // Map to include order stats (which would be properly fetched in a real implementation)
      const consumersWithStats: ConsumerWithOrderStats[] = (data || []).map(consumer => ({
        ...consumer,
        total_orders: 0,
        last_order_date: null,
        total_order_volume: 0
      }));

      return consumersWithStats;
    } catch (error) {
      console.error("Error in fetchConsumers:", error);
      return [];
    }
  };

  const {
    data: consumers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["consumers", searchQuery],
    queryFn: fetchConsumers
  });

  return (
    <div className="min-h-screen bg-background">
      {!isTabMode && <Navbar />}
      <main className="container mx-auto space-y-6 py-0">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("search_consumers")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeFilterCount > 0 && (
            <Button onClick={() => setSearchQuery("")} variant="outline" size="icon">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4 mr-2" /> {t("add_consumer")}
          </Button>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("active_filters")}:</span>
            <Badge variant="outline" className="font-mono">
              {activeFilterCount}
            </Badge>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ConsumersTable consumers={consumers} onConsumerSelect={setSelectedConsumer} />
        )}

        {selectedConsumer && (
          <ConsumerDetailsDrawer
            consumer={selectedConsumer}
            open={!!selectedConsumer}
            onClose={() => setSelectedConsumer(null)}
            onConsumerUpdated={refetch}
          />
        )}

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{t("create_consumer")}</DialogTitle>
            </DialogHeader>
            <ConsumerForm
              onComplete={() => {
                setIsCreateModalOpen(false);
                refetch();
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ConsumersPage;
