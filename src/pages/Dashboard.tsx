import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useFrequencias } from "@/hooks/useFrequencias";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Users, Building2, Calendar, ArrowRight, UserCog, ClipboardList } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, role } = useIsAdmin();
  const { data: colaboradores = [] } = useColaboradores();
  const { data: orgaos = [] } = useOrgaos();
  const { data: frequencias = [] } = useFrequencias();

  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo).length;
  const colaboradoresInativos = colaboradores.filter((c) => !c.ativo).length;

  const currentMonth = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="page-header">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {isSuperAdmin ? "Painel do Super Administrador" : isAdmin ? "Painel do Administrador" : "Meu Painel"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Gerencie colaboradores e gere folhas de frequência mensal"
              : `Bem-vindo, ${user?.email}`}
          </p>
        </div>

        {/* Admin/Super Admin content */}
        {isAdmin && (
          <>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/20 p-4">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Gerar Frequência Mensal</h2>
                    <p className="text-muted-foreground">
                      {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="w-full md:w-auto gap-2">
                  <Link to="/gerar-frequencia">
                    <FileText className="h-5 w-5" />
                    Gerar Frequência
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-institutional">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores Ativos</CardTitle>
                  <div className="rounded-lg p-2 bg-success/10">
                    <Users className="h-4 w-4 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{colaboradoresAtivos}</div>
                  <p className="text-xs text-muted-foreground mt-1">{colaboradoresInativos} inativos</p>
                </CardContent>
              </Card>
              <Card className="card-institutional">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Órgãos Cadastrados</CardTitle>
                  <div className="rounded-lg p-2 bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{orgaos.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unidades administrativas</p>
                </CardContent>
              </Card>
              <Card className="card-institutional">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Frequências Geradas</CardTitle>
                  <div className="rounded-lg p-2 bg-warning/10">
                    <FileText className="h-4 w-4 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{frequencias.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total de relatórios</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link to="/colaboradores">
                <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-5 w-5 text-primary" />
                      Colaboradores
                    </CardTitle>
                    <CardDescription>Cadastrar e gerenciar servidores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/orgaos">
                <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-5 w-5 text-primary" />
                      Órgãos
                    </CardTitle>
                    <CardDescription>Gerenciar unidades administrativas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/frequencias">
                <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5 text-primary" />
                      Histórico
                    </CardTitle>
                    <CardDescription>Ver frequências geradas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>

              {isSuperAdmin && (
                <Link to="/gerenciar-usuarios">
                  <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <UserCog className="h-5 w-5 text-primary" />
                        Usuários
                      </CardTitle>
                      <CardDescription>Gerenciar usuários do sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                        Acessar <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </>
        )}

        {/* Regular user content */}
        {!isAdmin && (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Área do Usuário</h2>
            <p className="text-muted-foreground">
              Você está logado como usuário comum. Suas informações de ponto aparecerão aqui quando disponíveis.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
