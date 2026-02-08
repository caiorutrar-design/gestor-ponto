import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/Colaboradores";
import Orgaos from "./pages/Orgaos";
import Lotacoes from "./pages/Lotacoes";
import GerarFrequencia from "./pages/GerarFrequencia";
import Frequencias from "./pages/Frequencias";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            {/* Admin-only routes */}
            <Route path="/colaboradores" element={<AdminRoute><Colaboradores /></AdminRoute>} />
            <Route path="/orgaos" element={<AdminRoute><Orgaos /></AdminRoute>} />
            <Route path="/lotacoes" element={<AdminRoute><Lotacoes /></AdminRoute>} />
            <Route path="/gerar-frequencia" element={<AdminRoute><GerarFrequencia /></AdminRoute>} />
            <Route path="/frequencias" element={<AdminRoute><Frequencias /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
