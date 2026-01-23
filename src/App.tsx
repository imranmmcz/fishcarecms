import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FarmingProvider } from "@/contexts/FarmingContext";
// MySQL Backend Contexts - Hostinger MySQL Database
import { AuthProvider } from "@/contexts/AuthContextMySQL";
import { ProductsProvider } from "@/contexts/ProductsContextMySQL";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AdSettingsProvider } from "@/contexts/AdSettingsContextMySQL";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Modules from "./pages/Modules";
import PondCalculator from "./pages/PondCalculator";
import FishStocking from "./pages/FishStocking";
import StockingDensity from "./pages/StockingDensity";
import BiomassCalculator from "./pages/BiomassCalculator";
import FeedManagement from "./pages/FeedManagement";
import MedicineApplication from "./pages/MedicineApplication";
import FertilizerCalculator from "./pages/FertilizerCalculator";
import WaterQuality from "./pages/WaterQuality";
import CostCalculator from "./pages/CostCalculator";
import Reports from "./pages/Reports";
import FishAdvice from "./pages/FishAdvice";
import Shop from "./pages/Shop";
import FisheriesContact from "./pages/FisheriesContact";
import MarketPrice from "./pages/MarketPrice";
import Dashboard from "./pages/Dashboard";
import DashboardIncome from "./pages/DashboardIncome";
import DashboardExpense from "./pages/DashboardExpense";
import DashboardMyPond from "./pages/DashboardMyPond";
import DashboardReports from "./pages/DashboardReports";
import DashboardBackup from "./pages/DashboardBackup";
import DashboardSettings from "./pages/DashboardSettings";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import AdminProducts from "./pages/AdminProducts";
import AdminAds from "./pages/AdminAds";
import AdminPageBuilder from "./pages/AdminPageBuilder";
import AdminMarketPrices from "./pages/AdminMarketPrices";
import AdminDatabaseExport from "./pages/AdminDatabaseExport";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <ProductsProvider>
            <FarmingProvider>
              <AdSettingsProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/modules" element={<Modules />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/pond-calculator" element={<PondCalculator />} />
                    <Route path="/fish-stocking" element={<FishStocking />} />
                    <Route path="/stocking-density" element={<StockingDensity />} />
                    <Route path="/biomass-calculator" element={<BiomassCalculator />} />
                    <Route path="/feed-management" element={<FeedManagement />} />
                    <Route path="/medicine-application" element={<MedicineApplication />} />
                    <Route path="/fertilizer-calculator" element={<FertilizerCalculator />} />
                    <Route path="/water-quality" element={<WaterQuality />} />
                    <Route path="/cost-calculator" element={<CostCalculator />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/fish-advice" element={<FishAdvice />} />
                    <Route path="/fisheries-contact" element={<FisheriesContact />} />
                    <Route path="/market-price" element={<MarketPrice />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/income" element={<ProtectedRoute><DashboardIncome /></ProtectedRoute>} />
                    <Route path="/dashboard/expense" element={<ProtectedRoute><DashboardExpense /></ProtectedRoute>} />
                    <Route path="/dashboard/my-pond" element={<ProtectedRoute><DashboardMyPond /></ProtectedRoute>} />
                    <Route path="/dashboard/reports" element={<ProtectedRoute><DashboardReports /></ProtectedRoute>} />
                    <Route path="/dashboard/backup" element={<ProtectedRoute><DashboardBackup /></ProtectedRoute>} />
                    <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
                    <Route path="/admin/ads" element={<ProtectedRoute requireAdmin><AdminAds /></ProtectedRoute>} />
                    <Route path="/admin/page-builder" element={<ProtectedRoute requireAdmin><AdminPageBuilder /></ProtectedRoute>} />
                    <Route path="/admin/market-prices" element={<ProtectedRoute requireAdmin><AdminMarketPrices /></ProtectedRoute>} />
                    <Route path="/admin/database-export" element={<ProtectedRoute requireAdmin><AdminDatabaseExport /></ProtectedRoute>} />
                    <Route path="/admin/profile" element={<ProtectedRoute requireAdmin><Profile /></ProtectedRoute>} />
                    <Route path="/install" element={<Install />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AdSettingsProvider>
          </FarmingProvider>
        </ProductsProvider>
      </AuthProvider>
    </CurrencyProvider>
  </LanguageProvider>
</QueryClientProvider>
);

export default App;
