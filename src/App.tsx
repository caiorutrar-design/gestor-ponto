import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminOrSuperRoute } from "@/components/AdminOrSuperRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/Colaboradores";
import Orgaos from "./pages/Orgaos";
import Lotacoes from "./pages/Lotacoes";
import GerarFrequencia from "./pages/GerarFrequencia";
import Frequencias from "./pages/Frequencias";
import GerenciamentoUsuarios from "./pages/GerenciamentoUsuarios";
import LogsAuditoria from "./pages/LogsAuditoria";
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
            {/* Admin + Super Admin routes */}
            <Route path="/colaboradores" element={<AdminOrSuperRoute><Colaboradores /></AdminOrSuperRoute>} />
            <Route path="/orgaos" element={<AdminOrSuperRoute><Orgaos /></AdminOrSuperRoute>} />
            <Route path="/lotacoes" element={<AdminOrSuperRoute><Lotacoes /></AdminOrSuperRoute>} />
            <Route path="/gerar-frequencia" element={<AdminOrSuperRoute><GerarFrequencia /></AdminOrSuperRoute>} />
            <Route path="/frequencias" element={<AdminOrSuperRoute><Frequencias /></AdminOrSuperRoute>} />
            <Route path="/logs-auditoria" element={<AdminOrSuperRoute><LogsAuditoria /></AdminOrSuperRoute>} />
            {/* Super Admin only */}
            <Route path="/gerenciar-usuarios" element={<SuperAdminRoute><GerenciamentoUsuarios /></SuperAdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
