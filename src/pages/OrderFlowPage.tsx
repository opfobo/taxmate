
import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout } from "@/components/common/PageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClipboardList,
  CheckSquare,
  Package,
  CreditCard,
  Truck,
  FileText,
  PlusCircle,
} from "lucide-react";

const OrderFlowPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("scouting");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const workflowTabs = [
    {
      id: "scouting",
      label: t("order_flow_page.section_scouting"),
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      id: "order_confirmation",
      label: t("order_flow_page.section_order_confirmation"),
      icon: <CheckSquare className="h-4 w-4" />,
    },
    {
      id: "inventory_assignment",
      label: t("order_flow_page.section_inventory_assignment"),
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: "payment_tracking",
      label: t("order_flow_page.section_payment_tracking"),
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: "shipping_tracking",
      label: t("order_flow_page.section_shipping_tracking"),
      icon: <Truck className="h-4 w-4" />,
    },
    {
      id: "sales_order",
      label: t("order_flow_page.section_sales_order"),
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  return (
    <PageLayout>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("order_flow_page.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("order_flow_page.placeholder")}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {activeTab === "scouting" && (
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                {t("order_flow_page.action_create_request")}
              </Button>
            )}
          </div>
        </div>
        <Separator className="my-4" />

        {/* Tabs Navigation */}
        <Tabs 
          defaultValue="scouting" 
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 p-1 bg-muted/60 rounded-md">
            {workflowTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 py-2"
              >
                {tab.icon}
                <span className="hidden md:inline-block">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Contents */}
          {workflowTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <Card>
                <CardHeader className="bg-muted/20 border-b">
                  <CardTitle className="text-lg">{tab.label}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Alert className="bg-muted/10 border border-dashed">
                    <AlertDescription className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="text-muted-foreground mb-2">
                        {t("common.no_data")}
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {t("order_flow_page.placeholder")}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t p-4 flex justify-end">
                  <Button variant="secondary">
                    {t("common.action_placeholder") || "Continue"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OrderFlowPage;
