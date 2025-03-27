import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import TransactionsTable from "@/components/transactions/TransactionsTable";
import TransactionsFilters from "@/components/transactions/TransactionsFilters";
import TransactionsSummary from "@/components/transactions/TransactionsSummary";
import TransactionDrawer from "@/components/transactions/TransactionDrawer";
import { DateRange } from "react-day-picker";
import { AlertCircle, PlusCircle } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

// Interface for transactions from the database
export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  type: "purchase" | "refund" | "payout";
  status: "success" | "pending" | "failed" | "unmatched" | "matched";
  user_id: string;
  order_id?: string | null;
  payment_method?: string | null;
  updated_at?: string | null;
  notes?: string | null;
  linked_order_ids?: string[] | null;
  // For UI display only - not stored in database
  order_number?: string | null;
  order_status?: string | null;
  matched_orders?: Order[] | null;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  amount: number;
  currency: string | null;
  created_at: string | null;
}

const TransactionsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined });
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const pageSize = 10;

  // Fetch transactions with filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions", user?.id, searchQuery, statusFilter, typeFilter, dateRange, currentPage],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      let query = supabase
        .from("transactions")
        .select("*, orders(id, order_number, status, amount, currency)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      // Apply filters if set
      if (searchQuery) {
        query = query.or(`id.ilike.%${searchQuery}%,payment_method.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`);
      }
      
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      
      if (typeFilter) {
        query = query.eq("type", typeFilter);
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
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Count total transactions for pagination
      const { count: totalCount, error: countError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (countError) throw countError;

      // Format transactions to include order details
      const formattedTransactions = await Promise.all(data.map(async (transaction: any) => {
        const orderData = transaction.orders || null;
        
        // For transactions with linked_order_ids, fetch the matched orders
        let matchedOrders = null;
        if (transaction.linked_order_ids && transaction.linked_order_ids.length > 0) {
          const { data: matchedOrdersData } = await supabase
            .from("orders")
            .select("id, order_number, status, amount, currency")
            .in("id", transaction.linked_order_ids);
          
          matchedOrders = matchedOrdersData || null;
        }
        
        return {
          ...transaction,
          order_number: orderData ? orderData.order_number : null,
          order_status: orderData ? orderData.status : null,
          matched_orders: matchedOrders,
          orders: undefined // Remove the nested orders object
        };
      }));
      
      return {
        transactions: formattedTransactions as Transaction[],
        total: totalCount || 0
      };
    },
    enabled: !!user,
  });

  // Fetch summary data for transactions
  const { data: summaryData } = useQuery({
    queryKey: ["transactions-summary", user?.id, dateRange],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      let query = supabase
        .from("transactions")
        .select("type, amount, currency")
        .eq("user_id", user.id);
      
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
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate totals by type
      const summary = {
        purchase: 0,
        refund: 0,
        payout: 0,
        total: 0,
        currency: "EUR" // Default currency
      };
      
      data.forEach((transaction: any) => {
        // Validate the transaction type before using it
        const validType = transaction.type === 'purchase' || 
                         transaction.type === 'refund' || 
                         transaction.type === 'payout';
        
        if (validType && transaction.type) {
          // Now TypeScript knows that transaction.type is one of the valid types
          summary[transaction.type as 'purchase' | 'refund' | 'payout'] += Number(transaction.amount);
        }
        
        if (transaction.type === "purchase") {
          summary.total -= Number(transaction.amount);
        } else {
          summary.total += Number(transaction.amount);
        }
        
        // Use the currency from the first transaction (assuming one currency is used)
        if (transaction.currency) {
          summary.currency = transaction.currency;
        }
      });
      
      return summary;
    },
    enabled: !!user,
  });

  // Fetch available orders for matching
  const { data: ordersData } = useQuery({
    queryKey: ["available-orders", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, amount, currency, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data as Order[];
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

  // Handle transaction create/update
  const handleTransactionSave = async (transactionData: Partial<Transaction>, isEditing: boolean) => {
    try {
      if (isEditing && selectedTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("transactions")
          .update({
            amount: transactionData.amount,
            currency: transactionData.currency,
            type: transactionData.type,
            status: transactionData.status,
            payment_method: transactionData.payment_method,
            order_id: transactionData.order_id,
            notes: transactionData.notes,
            linked_order_ids: transactionData.linked_order_ids,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedTransaction.id);
        
        if (error) throw error;
        
        toast({
          title: t("transaction_updated"),
          description: t("transaction_updated_description"),
        });
      } else {
        // Create new transaction
        const { error } = await supabase
          .from("transactions")
          .insert({
            amount: transactionData.amount,
            currency: transactionData.currency || "EUR",
            type: transactionData.type,
            status: transactionData.status || "unmatched",
            payment_method: transactionData.payment_method,
            order_id: transactionData.order_id,
            notes: transactionData.notes,
            linked_order_ids: transactionData.linked_order_ids,
            user_id: user?.id
          });
        
        if (error) throw error;
        
        toast({
          title: t("transaction_created"),
          description: t("transaction_created_description"),
        });
      }
      
      // Close form and refetch data
      setIsTransactionDrawerOpen(false);
      setSelectedTransaction(null);
      refetch();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error instanceof Error ? error.message : t("unknown_error"),
      });
    }
  };

  // Handle transaction delete
  const handleTransactionDelete = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);
      
      if (error) throw error;
      
      toast({
        title: t("transaction_deleted"),
        description: t("transaction_deleted_description"),
      });
      
      refetch();
    }
    catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: error instanceof Error ? error.message : t("unknown_error"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{t("transactions")}</h1>
              <p className="text-muted-foreground mt-2">
                {t("transactions_description")}
              </p>
            </div>
            
            <Button 
              onClick={() => {
                setSelectedTransaction(null);
                setIsTransactionDrawerOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("record_transaction")}
            </Button>
          </div>

          {summaryData && (
            <TransactionsSummary
              purchases={summaryData.purchase}
              refunds={summaryData.refund}
              payouts={summaryData.payout}
              total={summaryData.total}
              currency={summaryData.currency}
            />
          )}
        </div>

        {/* Filters */}
        <TransactionsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
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
            <TransactionsTable
              transactions={data.transactions}
              onEdit={(transaction) => {
                setSelectedTransaction(transaction);
                setIsTransactionDrawerOpen(true);
              }}
              onDelete={handleTransactionDelete}
            />
            
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

      {/* Transaction drawer for creating/editing transactions */}
      <TransactionDrawer
        open={isTransactionDrawerOpen}
        onOpenChange={setIsTransactionDrawerOpen}
        transaction={selectedTransaction}
        orders={ordersData || []}
        onSubmit={handleTransactionSave}
      />
    </div>
  );
};

export default TransactionsPage;
