
import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignInventoryToOrderForm } from "@/components/inventory/AssignInventoryToOrderForm";
import { AssignedItemsTable } from "@/components/inventory/AssignedItemsTable";
import { Order } from "@/types/order";

const AssignInventoryPage = () => {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <PageLayout>
      <div className="container py-8 space-y-6">
        <h1 className="text-3xl font-bold">{t("assign_inventory.title")}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("assign_inventory.select_order")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignInventoryToOrderForm 
              onOrderSelected={setSelectedOrder} 
              selectedOrder={selectedOrder}
            />
          </CardContent>
        </Card>
        
        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>{t("assign_inventory.already_assigned")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignedItemsTable orderId={selectedOrder.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default AssignInventoryPage;
