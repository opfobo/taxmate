import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import ConsumersTable from "@/components/consumers/ConsumersTable";
import ConsumerDetailsDrawer from "@/components/consumers/ConsumerDetailsDrawer";
import ConsumerForm from "@/components/consumers/ConsumerForm";
import { Consumer, ConsumerWithOrderStats } from "@/types/consumer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
const ConsumersPage = () => {
  const {
    t
  } = useTranslation();
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerWithOrderStats | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const isTabMode = location.pathname.startsWith("/dashboard/orders/");

  // Count active filters
  const activeFilterCount = searchQuery.trim().length > 0 ? 1 : 0;

  // Fetch consumers with order statistics
  const {
    data: consumers,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["consumers", searchQuery],
    queryFn: async () => {
      // First fetch consumers matching the search criteria
      let query = supabase.from("consumers").select("*").order("created_at", {
        ascending: false
      });
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,postal_code.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }
      const {
        data: consumersData,
        error
      } = await query;
      if (error) {
        throw error;
      }

      // For each consumer, fetch their order statistics
      const consumersWithStats: ConsumerWithOrderStats[] = await Promise.all(consumersData.map(async (consumer: Consumer) => {
        // Get order count
        const {
          count: orderCount,
          error: countError
        } = await supabase.from("orders").select("id", {
          count: "exact"
        }).eq("consumer_id", consumer.id);

        // Get latest order
        const {
          data: latestOrders,
          error: latestError
        } = await supabase.from("orders").select("order_date, amount").eq("consumer_id", consumer.id).order("order_date", {
          ascending: false
        }).limit(1);

        // Get total order volume
        const {
          data: ordersData,
          error: volumeError
        } = await supabase.from("orders").select("amount").eq("consumer_id", consumer.id);
        const totalVolume = ordersData?.reduce((sum, order) => sum + (parseFloat(String(order.amount)) || 0), 0) || 0;
        return {
          ...consumer,
          total_orders: orderCount || 0,
          last_order_date: latestOrders?.[0]?.order_date || null,
          total_order_volume: totalVolume
        };
      }));
      return consumersWithStats;
    }
  });
  const handleConsumerSelect = (consumer: ConsumerWithOrderStats) => {
    setSelectedConsumer(consumer);
  };
  const handleCreateConsumer = () => {
    setIsCreateModalOpen(true);
  };
  const handleCreateComplete = () => {
    setIsCreateModalOpen(false);
    refetch();
  };
  const handleCloseDrawer = () => {
    setSelectedConsumer(null);
  };
  const handleClearFilters = () => {
    setSearchQuery("");
  };
  return <div className="min-h-screen bg-background">
      {!isTabMode && <Navbar />}
      <main className="container mx-auto space-y-6 py-0">
        

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder={t("search_consumers")} className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          
          {activeFilterCount > 0 && <Button onClick={handleClearFilters} variant="outline" size="icon" className="flex-shrink-0 h-10 w-10" title={t("clear_filters")}>
              <X className="h-4 w-4" />
            </Button>}
          
          <Button onClick={handleCreateConsumer} className="flex items-center gap-2">
            <Plus className="h-4 w-4 mr-2" /> {t("add_consumer")}
          </Button>
        </div>

        {activeFilterCount > 0 && <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("active_filters")}:
            </span>
            <Badge variant="outline" className="font-mono">
              {activeFilterCount}
            </Badge>
          </div>}

        {isLoading ? <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : <ConsumersTable consumers={consumers || []} onConsumerSelect={handleConsumerSelect} />}

        {selectedConsumer && <ConsumerDetailsDrawer consumer={selectedConsumer} onClose={handleCloseDrawer} onConsumerUpdated={refetch} />}

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{t("create_consumer")}</DialogTitle>
            </DialogHeader>
            <ConsumerForm onComplete={handleCreateComplete} onCancel={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </main>
    </div>;
};
export default ConsumersPage;