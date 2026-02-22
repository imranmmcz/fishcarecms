import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FarmingProvider } from "@/contexts/FarmingContext";
// Supabase/Lovable Cloud Contexts
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AdSettingsProvider } from "@/contexts/AdSettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeLoader } from "@/components/ThemeLoader";
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
import FeedFormulaCalculator from "./pages/FeedFormulaCalculator";
import Shop from "./pages/Shop";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import FisheriesContact from "./pages/FisheriesContact";
import MarketPrice from "./pages/MarketPrice";
import Dashboard from "./pages/Dashboard";
import DashboardIncome from "./pages/DashboardIncome";
import DashboardExpense from "./pages/DashboardExpense";
import DashboardMyPond from "./pages/DashboardMyPond";
import DashboardReports from "./pages/DashboardReports";
import DashboardBackup from "./pages/DashboardBackup";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardOrders from "./pages/DashboardOrders";
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
import AdminBackup from "./pages/AdminBackup";
import AdminEcommerceOverview from "./pages/AdminEcommerceOverview";
import AdminPages from "./pages/AdminPages";
import CustomPage from "./pages/CustomPage";
import AdminOrders from "./pages/AdminOrders";
import AdminInventory from "./pages/AdminInventory";
import AdminCustomers from "./pages/AdminCustomers";
import AdminSuppliers from "./pages/AdminSuppliers";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <WishlistProvider>
              <FarmingProvider>
                <AdSettingsProvider>
                  <TooltipProvider>
                    <ThemeLoader />
                    <Toaster />
                    <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/modules" element={<Modules />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/product/:id" element={<ProductDetails />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
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
                      <Route path="/feed-formula" element={<FeedFormulaCalculator />} />
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
                      <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardOrders /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                      <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
                      <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
                      <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
                      <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
                      <Route path="/admin/ads" element={<ProtectedRoute requireAdmin><AdminAds /></ProtectedRoute>} />
                      <Route path="/admin/page-builder" element={<ProtectedRoute requireAdmin><AdminPageBuilder /></ProtectedRoute>} />
                      <Route path="/admin/market-prices" element={<ProtectedRoute requireAdmin><AdminMarketPrices /></ProtectedRoute>} />
                      <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminInventory /></ProtectedRoute>} />
                      <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><AdminCustomers /></ProtectedRoute>} />
                      <Route path="/admin/suppliers" element={<ProtectedRoute requireAdmin><AdminSuppliers /></ProtectedRoute>} />
                      <Route path="/admin/database-export" element={<ProtectedRoute requireAdmin><AdminDatabaseExport /></ProtectedRoute>} />
                      <Route path="/admin/backup" element={<ProtectedRoute requireAdmin><AdminBackup /></ProtectedRoute>} />
                      <Route path="/admin/ecommerce-overview" element={<ProtectedRoute requireAdmin><AdminEcommerceOverview /></ProtectedRoute>} />
                      <Route path="/admin/pages" element={<ProtectedRoute requireAdmin><AdminPages /></ProtectedRoute>} />
                      <Route path="/pages/:slug" element={<CustomPage />} />
                      <Route path="/admin/profile" element={<ProtectedRoute requireAdmin><Profile /></ProtectedRoute>} />
                      <Route path="/install" element={<Install />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </AdSettingsProvider>
            </FarmingProvider>
              </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </CurrencyProvider>
  </LanguageProvider>
</QueryClientProvider>
);

export default App;
