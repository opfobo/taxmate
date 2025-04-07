
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
import LoginPage from "./pages/auth/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";
import SalesOrdersPage from "./pages/orders/SalesOrdersPage";
import PurchasesOrdersPage from "./pages/orders/PurchasesOrdersPage";
import ConsumersPage from "./pages/ConsumersPage";
import OrdersLayout from "./layouts/OrdersLayout";
import OcrLayout from "./layouts/OcrLayout";
import InvoiceOcrTab from "./components/ocr/InvoiceOcrTab";
import ConsumerOcrTab from "./components/ocr/ConsumerOcrTab";

function App() {
  const { user, session, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // No longer using setAuthStatus
      } else {
        // No longer using setAuthStatus
      }
      setIsLoading(false);
    };

    checkAuth();

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // No longer using setAuthStatus
      } else if (event === "SIGNED_OUT") {
        // No longer using setAuthStatus
      }
    });
  }, []);

  if (loading || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            !user ? (
              <LoginPage />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            user ? (
              <SettingsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard/transactions"
          element={
            user ? (
              <TransactionsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard/orders"
          element={
            user ? (
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
        
        <Route
          path="/dashboard/ocr"
          element={
            user ? (
              <OcrLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="" element={<InvoiceOcrTab />} />
          <Route path="invoice" element={<InvoiceOcrTab />} />
          <Route path="consumer" element={<ConsumerOcrTab />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
