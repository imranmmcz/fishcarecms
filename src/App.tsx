import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FarmingProvider } from "@/contexts/FarmingContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Dashboard from "./pages/Dashboard";
import DashboardIncome from "./pages/DashboardIncome";
import DashboardExpense from "./pages/DashboardExpense";
import DashboardMyPond from "./pages/DashboardMyPond";
import DashboardReports from "./pages/DashboardReports";
import DashboardBackup from "./pages/DashboardBackup";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FarmingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/modules" element={<Modules />} />
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/income" element={<DashboardIncome />} />
              <Route path="/dashboard/expense" element={<DashboardExpense />} />
              <Route path="/dashboard/my-pond" element={<DashboardMyPond />} />
              <Route path="/dashboard/reports" element={<DashboardReports />} />
              <Route path="/dashboard/backup" element={<DashboardBackup />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FarmingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
