import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, MapPin, Menu, X, LogOut,
  Shield, ShieldCheck, ClipboardList, UserCog, Clock, Timer,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: "admin" | "super_admin" | "gestor";
}

const navigation: NavItem[] = [
  { name: "Início", href: "/", icon: LayoutDashboard },
  { name: "Registro de Ponto", href: "/registro-ponto", icon: Clock },
  { name: "Colaboradores", href: "/colaboradores", icon: Users, requiredRole: "admin" },
  { name: "Órgãos", href: "/orgaos", icon: Building2, requiredRole: "admin" },
  { name: "Lotações", href: "/lotacoes", icon: MapPin, requiredRole: "admin" },
  { name: "Registros de Ponto", href: "/gerenciar-pontos", icon: Timer, requiredRole: "gestor" },
  { name: "Logs de Auditoria", href: "/logs-auditoria", icon: ClipboardList, requiredRole: "admin" },
  { name: "Gerenciar Usuários", href: "/gerenciar-usuarios", icon: UserCog, requiredRole: "super_admin" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isAdmin, isSuperAdmin, isGestor, role } = useIsAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavigation = navigation.filter((item) => {
    if (!item.requiredRole) return true;
    if (item.requiredRole === "super_admin") return isSuperAdmin;
    if (item.requiredRole === "admin") return isAdmin;
    if (item.requiredRole === "gestor") return isAdmin || isGestor;
    return false;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const roleLabel = role === "super_admin" ? "Super Admin" : role === "admin" ? "RH" : role === "gestor" ? "Gestor" : "Colaborador";
  const RoleIcon = role === "super_admin" ? ShieldCheck : Shield;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 sidebar-header-gradient">
          <h1 className="text-lg font-bold text-sidebar-foreground">Gestão de Ponto</h1>
          <Button
            variant="ghost" size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {visibleNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4 space-y-3">
          {user && (
            <div className="rounded-lg bg-sidebar-accent/30 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-sidebar-foreground/70 truncate flex-1">{user.email}</p>
                {(isAdmin || isSuperAdmin) && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-primary/50 text-primary">
                    <RoleIcon className="h-2.5 w-2.5 mr-0.5" />
                    {roleLabel}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
          <div className="rounded-lg bg-sidebar-accent/30 px-4 py-3">
            <p className="text-xs text-sidebar-foreground/70">Sistema de Gestão de Ponto</p>
            <p className="text-xs text-sidebar-foreground/50 mt-1">v3.0.0</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Gestão de Ponto</h1>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
