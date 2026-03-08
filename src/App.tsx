import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FarmingProvider } from "@/contexts/FarmingContext";
// MySQL API Contexts
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AdSettingsProvider } from "@/contexts/AdSettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeLoader } from "@/components/ThemeLoader";
import { POSLayout } from "@/components/POSLayout";
import FloatingChatbot from "@/components/FloatingChatbot";
import GoogleAnalyticsLoader from "@/components/GoogleAnalyticsLoader";
import { ActivityLogger } from "@/components/ActivityLogger";
import { preloadBanglaFont } from "@/lib/pdfBanglaFont";

// Pre-load Nikosh font for PDF generation
preloadBanglaFont();
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
import DashboardBlog from "./pages/DashboardBlog";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import AdminIncompleteOrders from "./pages/AdminIncompleteOrders";
import AdminInventory from "./pages/AdminInventory";
import AdminCustomers from "./pages/AdminCustomers";
import AdminSuppliers from "./pages/AdminSuppliers";
import Profile from "./pages/Profile";
import AdminDiseases from "./pages/AdminDiseases";
import DiseaseAdvice from "./pages/DiseaseAdvice";
import AdminCalculators from "./pages/AdminCalculators";
import AdminPOS from "./pages/AdminPOS";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminBlog from "./pages/AdminBlog";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminNotificationTemplates from "./pages/AdminNotificationTemplates";
import AdminFarmingReports from "./pages/AdminFarmingReports";
import FarmProfitPrediction from "./pages/FarmProfitPrediction";
import SmartFeedCalculator from "./pages/SmartFeedCalculator";
import MedicineRecommendation from "./pages/MedicineRecommendation";
import DashboardAlerts from "./pages/DashboardAlerts";
import DashboardDiseaseDetect from "./pages/DashboardDiseaseDetect";
import FishSpecies from "./pages/FishSpecies";
import POSDashboard from "./pages/pos/POSDashboard";
import POSHistory from "./pages/pos/POSHistory";
import POSShifts from "./pages/pos/POSShifts";
import POSStockTransfers from "./pages/pos/POSStockTransfers";
import POSVariations from "./pages/pos/POSVariations";
import POSCategories from "./pages/pos/POSCategories";
import POSBrands from "./pages/pos/POSBrands";
import POSUnits from "./pages/pos/POSUnits";
import POSPurchaseList from "./pages/pos/POSPurchaseList";
import POSNewPurchase from "./pages/pos/POSNewPurchase";
import POSPurchaseReturns from "./pages/pos/POSPurchaseReturns";
import POSPurchaseReport from "./pages/pos/POSPurchaseReport";
import POSSalesReturns from "./pages/pos/POSSalesReturns";
import POSSalesReport from "./pages/pos/POSSalesReport";
import POSOnlineOrders from "./pages/pos/POSOnlineOrders";
import POSDueCollections from "./pages/pos/POSDueCollections";
import POSCustomerDueReport from "./pages/pos/POSCustomerDueReport";
import POSReports from "./pages/pos/POSReports";
import POSExpenses from "./pages/pos/POSExpenses";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import TrackOrder from "./pages/TrackOrder";

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
                    <GoogleAnalyticsLoader />
                    <Toaster />
                    <Sonner />
                  <BrowserRouter>
                    <ActivityLogger />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/modules" element={<Modules />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/product/:id" element={<ProductDetails />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
                      <Route path="/track-order" element={<TrackOrder />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/fish-species" element={<FishSpecies />} />
                      <Route path="/disease-advice" element={<DiseaseAdvice />} />
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
                      <Route path="/medicine-recommendation" element={<MedicineRecommendation />} />
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
                      <Route path="/dashboard/blog" element={<ProtectedRoute><DashboardBlog /></ProtectedRoute>} />
                      <Route path="/dashboard/profit-prediction" element={<ProtectedRoute><FarmProfitPrediction /></ProtectedRoute>} />
                      <Route path="/dashboard/smart-feed" element={<ProtectedRoute><SmartFeedCalculator /></ProtectedRoute>} />
                      <Route path="/smart-feed-calculator" element={<SmartFeedCalculator />} />
                      <Route path="/dashboard/alerts" element={<ProtectedRoute><DashboardAlerts /></ProtectedRoute>} />
                      <Route path="/dashboard/disease-detect" element={<ProtectedRoute><DashboardDiseaseDetect /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                      <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
                      <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
                      <Route path="/admin/incomplete-orders" element={<ProtectedRoute requireAdmin><AdminIncompleteOrders /></ProtectedRoute>} />
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
                      <Route path="/admin/diseases" element={<ProtectedRoute requireAdmin><AdminDiseases /></ProtectedRoute>} />
                      <Route path="/admin/calculators" element={<ProtectedRoute requireAdmin><AdminCalculators /></ProtectedRoute>} />
                      <Route path="/admin/pos" element={<ProtectedRoute requireAdmin><AdminPOS /></ProtectedRoute>} />
                      <Route path="/admin/blog" element={<ProtectedRoute requireAdmin><AdminBlog /></ProtectedRoute>} />
                      <Route path="/admin/campaigns" element={<ProtectedRoute requireAdmin><AdminCampaigns /></ProtectedRoute>} />
                      <Route path="/admin/notification-templates" element={<ProtectedRoute requireAdmin><AdminNotificationTemplates /></ProtectedRoute>} />
                      <Route path="/admin/farming-reports" element={<ProtectedRoute requireAdmin><AdminFarmingReports /></ProtectedRoute>} />
                      <Route path="/pos" element={<ProtectedRoute requireAdmin><POSDashboard /></ProtectedRoute>} />
                      <Route path="/pos/sell" element={<ProtectedRoute requireAdmin><AdminPOS /></ProtectedRoute>} />
                      <Route path="/pos/history" element={<ProtectedRoute requireAdmin><POSHistory /></ProtectedRoute>} />
                      <Route path="/pos/shifts" element={<ProtectedRoute requireAdmin><POSShifts /></ProtectedRoute>} />
                      <Route path="/pos/online-orders" element={<ProtectedRoute requireAdmin><POSOnlineOrders /></ProtectedRoute>} />
                      <Route path="/pos/products" element={<ProtectedRoute requireAdmin><AdminProducts Layout={POSLayout} /></ProtectedRoute>} />
                      <Route path="/pos/inventory" element={<ProtectedRoute requireAdmin><AdminInventory Layout={POSLayout} /></ProtectedRoute>} />
                      <Route path="/pos/customers" element={<ProtectedRoute requireAdmin><AdminCustomers Layout={POSLayout} /></ProtectedRoute>} />
                      <Route path="/pos/suppliers" element={<ProtectedRoute requireAdmin><AdminSuppliers Layout={POSLayout} /></ProtectedRoute>} />
                      <Route path="/pos/stock-transfers" element={<ProtectedRoute requireAdmin><POSStockTransfers /></ProtectedRoute>} />
                      <Route path="/pos/variations" element={<ProtectedRoute requireAdmin><POSVariations /></ProtectedRoute>} />
                      <Route path="/pos/categories" element={<ProtectedRoute requireAdmin><POSCategories /></ProtectedRoute>} />
                      <Route path="/pos/brands" element={<ProtectedRoute requireAdmin><POSBrands /></ProtectedRoute>} />
                      <Route path="/pos/units" element={<ProtectedRoute requireAdmin><POSUnits /></ProtectedRoute>} />
                      <Route path="/pos/purchases" element={<ProtectedRoute requireAdmin><POSPurchaseList /></ProtectedRoute>} />
                      <Route path="/pos/purchases/new" element={<ProtectedRoute requireAdmin><POSNewPurchase /></ProtectedRoute>} />
                      <Route path="/pos/purchases/returns" element={<ProtectedRoute requireAdmin><POSPurchaseReturns /></ProtectedRoute>} />
                      <Route path="/pos/purchases/report" element={<ProtectedRoute requireAdmin><POSPurchaseReport /></ProtectedRoute>} />
                      <Route path="/pos/sales/returns" element={<ProtectedRoute requireAdmin><POSSalesReturns /></ProtectedRoute>} />
                      <Route path="/pos/sales/report" element={<ProtectedRoute requireAdmin><POSSalesReport /></ProtectedRoute>} />
                      <Route path="/pos/due-collections" element={<ProtectedRoute requireAdmin><POSDueCollections /></ProtectedRoute>} />
                      <Route path="/pos/customer-due-report" element={<ProtectedRoute requireAdmin><POSCustomerDueReport /></ProtectedRoute>} />
                      <Route path="/pos/reports" element={<ProtectedRoute requireAdmin><POSReports /></ProtectedRoute>} />
                      <Route path="/pos/expenses" element={<ProtectedRoute requireAdmin><POSExpenses /></ProtectedRoute>} />
                      <Route path="/admin/profile" element={<ProtectedRoute requireAdmin><Profile /></ProtectedRoute>} />
                      <Route path="/install" element={<Install />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <FloatingChatbot />
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
