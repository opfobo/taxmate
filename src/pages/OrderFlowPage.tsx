
import { PageLayout } from "@/components/common/PageLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const OrderFlowPage = () => {
  const { t } = useTranslation();

  // Static example orders (placeholder data)
  const exampleOrders = [
    {
      id: "ord-001",
      orderNumber: "ORD-2023-001",
      customer: "Acme GmbH",
      status: "Aktiv", 
      total: 1250.50,
      date: "2023-05-15",
    },
    {
      id: "ord-002",
      orderNumber: "ORD-2023-002",
      customer: "Mustermann Solutions",
      status: "Abgeschlossen",
      total: 845.75,
      date: "2023-05-10",
    },
    {
      id: "ord-003",
      orderNumber: "ORD-2023-003",
      customer: "TechCorp AG",
      status: "In Bearbeitung",
      total: 2100.00,
      date: "2023-05-05",
    }
  ];

  // Placeholder handlers (no real functionality)
  const handleCreateOrder = () => {
    // This would handle order creation in a real implementation
  };

  const handleEditOrder = (orderId: string) => {
    // This would handle order editing in a real implementation
  };

  const handleDeleteOrder = (orderId: string) => {
    // This would handle order deletion in a real implementation
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    if (status === "Aktiv") {
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
    } else if (status === "Abgeschlossen") {
      return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>{status}</span>;
    } else if (status === "In Bearbeitung") {
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
    } else {
      return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  return (
    <PageLayout>
      <div className="container py-8">
        {/* Header Area */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t("orders.overviewTitle")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("orders.overviewDescription", { defaultValue: "Verwalten Sie alle Ihre Bestellungen an einem Ort." })}
            </p>
          </div>
          <Button 
            onClick={handleCreateOrder}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("orders.createNew")}
          </Button>
        </div>

        {/* Main Content Area */}
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orders.orderNumber")}</TableHead>
                    <TableHead>{t("orders.customer")}</TableHead>
                    <TableHead>{t("orders.status")}</TableHead>
                    <TableHead>{t("orders.total")}</TableHead>
                    <TableHead>{t("orders.date")}</TableHead>
                    <TableHead className="text-right">{t("orders.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exampleOrders.length > 0 ? (
                    exampleOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditOrder(order.id)}
                            >
                              {t("common.edit", { defaultValue: "Bearbeiten" })}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              {t("common.delete", { defaultValue: "Löschen" })}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">
                          {t("orders.noOrders", { defaultValue: "Keine Bestellungen vorhanden" })}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Placeholder */}
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OrderFlowPage;
