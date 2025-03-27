
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout } from "@/components/PageLayout";
import ConsumersTable from "@/components/consumers/ConsumersTable";
import ConsumerDetailsDrawer from "@/components/consumers/ConsumerDetailsDrawer";
import ConsumerForm from "@/components/consumers/ConsumerForm";
import { Consumer, ConsumerWithOrderStats } from "@/types/consumer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";

const ConsumersPage = () => {
  const { t } = useTranslation();
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerWithOrderStats | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch consumers with order statistics
  const { data: consumers, isLoading, refetch } = useQuery({
    queryKey: ["consumers", searchQuery],
    queryFn: async () => {
      // First fetch consumers matching the search criteria
      let query = supabase
        .from("consumers")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,postal_code.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        );
      }

      const { data: consumersData, error } = await query;

      if (error) {
        throw error;
      }

      // For each consumer, fetch their order statistics
      const consumersWithStats: ConsumerWithOrderStats[] = await Promise.all(
        consumersData.map(async (consumer: Consumer) => {
          // Get order count
          const { count: orderCount, error: countError } = await supabase
            .from("orders")
            .select("id", { count: "exact" })
            .eq("consumer_id", consumer.id);

          // Get latest order
          const { data: latestOrders, error: latestError } = await supabase
            .from("orders")
            .select("order_date, amount")
            .eq("consumer_id", consumer.id)
            .order("order_date", { ascending: false })
            .limit(1);

          // Get total order volume
          const { data: ordersData, error: volumeError } = await supabase
            .from("orders")
            .select("amount")
            .eq("consumer_id", consumer.id);

          const totalVolume = ordersData?.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0) || 0;

          return {
            ...consumer,
            total_orders: orderCount || 0,
            last_order_date: latestOrders?.[0]?.order_date || null,
            total_order_volume: totalVolume
          };
        })
      );

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

  return (
    <PageLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("consumers")}</h1>
          <Button onClick={handleCreateConsumer}>
            <Plus className="h-4 w-4 mr-2" /> {t("add_consumer")}
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("search_consumers")}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ConsumersTable
            consumers={consumers || []}
            onConsumerSelect={handleConsumerSelect}
          />
        )}

        {selectedConsumer && (
          <ConsumerDetailsDrawer
            consumer={selectedConsumer}
            onClose={handleCloseDrawer}
            onConsumerUpdated={refetch}
          />
        )}

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{t("create_consumer")}</DialogTitle>
            </DialogHeader>
            <ConsumerForm
              onComplete={handleCreateComplete}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default ConsumersPage;
