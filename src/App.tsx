import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MonthProvider } from "@/contexts/MonthContext";
import { LangProvider } from "@/contexts/LangContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Meals from "@/pages/Meals";
import Bazar from "@/pages/Bazar";
import Payments from "@/pages/Payments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Install from "@/pages/Install";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          <p className="text-muted-foreground animate-pulse">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <MonthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/bazar" element={<Bazar />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </MonthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
