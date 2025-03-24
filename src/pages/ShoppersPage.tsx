
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ShoppersTable from "@/components/shoppers/ShoppersTable";
import ShopperDetailsDrawer from "@/components/shoppers/ShopperDetailsDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search, ArrowUpDown } from "lucide-react";
import { Shopper } from "@/types/shopper";

const ShoppersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for search, filters and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedShopper, setSelectedShopper] = useState<Shopper | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Fetch shoppers with filters and sorting
  const { data: shoppers, isLoading, error } = useQuery({
    queryKey: ["shoppers", user?.id, searchQuery, regionFilter, sortOrder],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      let query = supabase
        .from("shoppers")
        .select("*")
        .order("created_at", { ascending: sortOrder === "asc" });
      
      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      // Apply region filter if provided
      if (regionFilter) {
        query = query.eq("region", regionFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as Shopper[];
    },
    enabled: !!user,
  });

  // Fetch unique regions for filter dropdown
  const { data: regions } = useQuery({
    queryKey: ["shopper-regions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("shoppers")
        .select("region")
        .not("region", "is", null)
        .order("region");
      
      if (error) throw error;
      
      // Get unique regions
      const uniqueRegions = Array.from(new Set(data.map(item => item.region).filter(Boolean)));
      return uniqueRegions;
    },
    enabled: !!user,
  });
  
  const handleShopperSelect = (shopper: Shopper) => {
    setSelectedShopper(shopper);
    setIsDetailsOpen(true);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("shoppers")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("shoppers_description")}
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search_shoppers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={regionFilter || ""}
            onValueChange={(value) => setRegionFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("region")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("all_regions")}</SelectItem>
              {regions?.map((region) => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={toggleSortOrder} className="w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === "asc" ? t("oldest_first") : t("newest_first")}
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 my-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">{t("error_loading_shoppers")}</h3>
              <p className="text-sm text-destructive/90">
                {error instanceof Error ? error.message : t("unknown_error")}
              </p>
            </div>
          </div>
        )}

        {/* Shoppers table */}
        <ShoppersTable 
          shoppers={shoppers || []} 
          isLoading={isLoading} 
          onShopperSelect={handleShopperSelect} 
        />
        
        {/* Shopper details drawer */}
        <ShopperDetailsDrawer
          shopper={selectedShopper}
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onShopperUpdated={() => {
            // Refresh shoppers data after update
            // This will be handled by the invalidation in the ShopperEditForm
          }}
        />
      </main>
    </div>
  );
};

export default ShoppersPage;
