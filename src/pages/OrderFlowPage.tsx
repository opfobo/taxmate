
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout } from "@/components/common/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const OrderFlowPage = () => {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("order_flow_page.title")}
          </h1>
          <Separator className="my-4" />
        </div>

        {/* Grid Layout for Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Scouting Requests */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>{t("order_flow_page.section_scouting")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                {t("order_flow_page.placeholder")}
              </p>
            </CardContent>
          </Card>

          {/* Order Confirmation */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>{t("order_flow_page.section_order_confirmation")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                {t("order_flow_page.placeholder")}
              </p>
            </CardContent>
          </Card>

          {/* Inventory Assignment */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>{t("order_flow_page.section_inventory_assignment")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                {t("order_flow_page.placeholder")}
              </p>
            </CardContent>
          </Card>

          {/* Payment Tracking */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>{t("order_flow_page.section_payment_tracking")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                {t("order_flow_page.placeholder")}
              </p>
            </CardContent>
          </Card>

          {/* Shipping & Tracking */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>{t("order_flow_page.section_shipping_tracking")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                {t("order_flow_page.placeholder")}
              </p>
            </CardContent>
          </Card>

          {/* Sales Order & Invoice */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>{t("order_flow_page.section_sales_order")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                {t("order_flow_page.placeholder")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default OrderFlowPage;
