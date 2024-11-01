import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/shared/Footer";
import Index from "./pages/Index";
import Questionnaire from "./pages/Questionnaire";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import About from "./pages/About";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (session) {
    const userContext = JSON.parse(localStorage.getItem('userContext') || '{}');
    if (userContext.questionnaire_completed) {
      return <Navigate to="/chat" />;
    }
    return <Navigate to="/questionnaire" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionContextProvider supabaseClient={supabase} initialSession={null}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/" element={<Index />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/questionnaire" element={<Questionnaire />} />
                  <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/about" element={<About />} />
                </Routes>
                {/* Only show Footer on non-chat pages */}
                <Routes>
                  <Route path="/chat" element={null} />
                  <Route path="*" element={<Footer />} />
                </Routes>
              </BrowserRouter>
            </div>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </SessionContextProvider>
  </QueryClientProvider>
);

export default App;