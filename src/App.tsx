
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ShoppersPage from "./pages/ShoppersPage";
import ConsumersPage from "./pages/ConsumersPage";
import TaxReportsPage from "./pages/TaxReportsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ResourcesPage from "./pages/ResourcesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import OcrTestPage from "@/pages/test/OcrTestPage";


// New Order Pages
import OrdersLayout from "./layouts/OrdersLayout";
import SalesOrdersPage from "./pages/orders/SalesOrdersPage";
import PurchasesOrdersPage from "./pages/orders/PurchasesOrdersPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="taxmaster-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/signup" element={<SignupPage />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/test/ocr" element={<OcrTestPage />} />

              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              
              {/* Orders Routes */}
              <Route path="/dashboard/orders" element={
                <ProtectedRoute>
                  <OrdersLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard/orders/sales" replace />} />
                <Route path="sales" element={<SalesOrdersPage />} />
                <Route path="purchases" element={<PurchasesOrdersPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="consumers" element={<ConsumersPage />} />
              </Route>
              
              <Route path="/shoppers" element={
                <ProtectedRoute>
                  <ShoppersPage />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/tax-reports" element={
                <ProtectedRoute>
                  <TaxReportsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/resources" element={
                <ProtectedRoute>
                  <ResourcesPage />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/analytics" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              
              {/* Legacy routes - redirect to new structure */}
              <Route path="/orders" element={<Navigate to="/dashboard/orders/sales" replace />} />
              <Route path="/consumers" element={<Navigate to="/dashboard/orders/consumers" replace />} />
              <Route path="/dashboard/transactions" element={<Navigate to="/dashboard/orders/transactions" replace />} />
              
              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
