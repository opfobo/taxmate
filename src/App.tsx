import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./integrations/supabase/client";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";
import SalesOrdersPage from "./pages/orders/SalesOrdersPage";
import PurchasesOrdersPage from "./pages/orders/PurchasesOrdersPage";
import ConsumersPage from "./pages/ConsumersPage";
import OrdersLayout from "./layouts/OrdersLayout";
import OcrLayout from "./layouts/OcrLayout";
import OcrPage from "./pages/OcrPage";
import InvoiceOcrTab from "./components/ocr/InvoiceOcrTab";
import ConsumerOcrTab from "./components/ocr/ConsumerOcrTab";

function App() {
  const { authStatus, setAuthStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setAuthStatus("authenticated");
      } else {
        setAuthStatus("unauthenticated");
      }
      setIsLoading(false);
    };

    checkAuth();

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setAuthStatus("authenticated");
      } else if (event === "SIGNED_OUT") {
        setAuthStatus("unauthenticated");
      }
    });
  }, [setAuthStatus]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            authStatus === "authenticated" ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            authStatus !== "authenticated" ? (
              <LoginPage />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            authStatus === "authenticated" ? (
              <DashboardPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            authStatus === "authenticated" ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            authStatus === "authenticated" ? (
              <SettingsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard/transactions"
          element={
            authStatus === "authenticated" ? (
              <TransactionsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard/orders"
          element={
            authStatus === "authenticated" ? (
              <OrdersLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="sales" element={<SalesOrdersPage />} />
          <Route path="purchases" element={<PurchasesOrdersPage />} />
          <Route path="consumers" element={<ConsumersPage />} />
        </Route>
        
        {/* Add the OCR-related routes to your route configuration: */}
        {
          authStatus === "authenticated" ? (
            <Route path="/dashboard/ocr" element={<OcrPage />} />
          ) : (
            <Route path="/dashboard/ocr" element={<Navigate to="/login" />} />
          )
        }
      </Routes>
    </Router>
  );
}

export default App;
