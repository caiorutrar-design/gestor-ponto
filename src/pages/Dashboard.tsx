import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Building2, ArrowRight, UserCog, ClipboardList, Clock, Timer } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useIsAdmin();
  const { data: colaboradores = [] } = useColaboradores();
  const { data: orgaos = [] } = useOrgaos();

  const hoje = format(new Date(), "yyyy-MM-dd");
  const { data: registrosHoje = [] } = useRegistrosPonto({ dataInicio: hoje, dataFim: hoje });

  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo).length;
  const colaboradoresInativos = colaboradores.filter((c) => !c.ativo).length;

  // Count unique colaboradores who registered today
  const colaboradoresComPonto = useMemo(() => {
    return new Set(registrosHoje.map((r) => r.colaborador_id)).size;
  }, [registrosHoje]);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="page-header">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {isSuperAdmin ? "Painel do Super Administrador" : isAdmin ? "Painel do Administrador" : "Meu Painel"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Gerencie colaboradores e registros de ponto" : `Bem-vindo, ${user?.email}`}
          </p>
        </div>

        {isAdmin && (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-institutional">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores Ativos</CardTitle>
                  <div className="rounded-lg p-2 bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
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
                </CardContent>
              </Card>
              <Card className="card-institutional">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pontos Registrados Hoje</CardTitle>
                  <div className="rounded-lg p-2 bg-accent">
                    <Timer className="h-4 w-4 text-accent-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{registrosHoje.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">{colaboradoresComPonto} colaborador(es)</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link to="/registro-ponto">
                <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-5 w-5 text-primary" />
                      Registro de Ponto
                    </CardTitle>
                    <CardDescription>Registrar ponto de colaboradores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/gerenciar-pontos">
                <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      Relatórios de Ponto
                    </CardTitle>
                    <CardDescription>Visualizar e exportar registros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
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

        {/* Regular user: redirect to registro de ponto */}
        {!isAdmin && (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Registro de Ponto</h2>
            <p className="text-muted-foreground mb-6">
              Acesse a página de registro para bater seu ponto digital.
            </p>
            <Button asChild size="lg">
              <Link to="/registro-ponto">Ir para Registro de Ponto</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
