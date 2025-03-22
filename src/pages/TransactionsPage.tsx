
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import TransactionsFilters from "@/components/transactions/TransactionsFilters";
import { DateRange } from "react-day-picker";
import { AlertCircle } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Interface for transactions from the database
export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  type: "purchase" | "refund" | "payout";
  status: "success" | "pending" | "failed";
  shopper_id: string;
  order_id?: string;
  payment_method?: string;
  updated_at?: string;
}

const TransactionsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch transactions with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions", user?.id, searchQuery, statusFilter, dateRange, currentPage],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("shopper_id", user.id)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      // Apply filters if set
      if (searchQuery) {
        query = query.ilike("id", `%${searchQuery}%`);
      }
      
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      
      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", fromDate.toISOString());
      }
      
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", toDate.toISOString());
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Count total transactions for pagination
      const { count: totalCount, error: countError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("shopper_id", user.id);
      
      if (countError) throw countError;
      
      return {
        transactions: data as Transaction[],
        total: totalCount || 0
      };
    },
    enabled: !!user,
  });

  // Calculate total pages for pagination
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("transactions")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("transactions_description")}
          </p>
        </div>

        {/* Filters */}
        <TransactionsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3 my-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">{t("error_loading_transactions")}</h3>
              <p className="text-sm text-destructive/90">
                {error instanceof Error ? error.message : t("unknown_error")}
              </p>
            </div>
          </div>
        )}

        {/* Transactions table */}
        {data && (
          <>
            <TransactionsTable transactions={data.transactions} />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            
            {data.transactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("no_transactions_found")}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TransactionsPage;
