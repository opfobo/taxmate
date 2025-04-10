
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Users 
} from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";

const OrdersLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the current active tab from URL
  const currentPath = location.pathname;
  const pathParts = currentPath.split('/');
  const activeTab = pathParts[pathParts.length - 1] || 'sales';
  
  // Handle initial redirect if needed
  useEffect(() => {
    if (currentPath === '/dashboard/orders') {
      navigate('/dashboard/orders/sales', { replace: true });
    }
  }, [currentPath, navigate]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    navigate(`/dashboard/orders/${value}`);
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">{t("orders")}</h1>
        
        <Tabs 
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full mb-8"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t("sales")}
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t("purchases")}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("transactions")}
            </TabsTrigger>
            <TabsTrigger value="consumers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("consumers")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Render the active tab content */}
        <Outlet />
      </div>
    </PageLayout>
  );
};

export default OrdersLayout;
