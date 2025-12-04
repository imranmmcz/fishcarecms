import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FarmingProvider } from "@/contexts/FarmingContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FarmingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FarmingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
