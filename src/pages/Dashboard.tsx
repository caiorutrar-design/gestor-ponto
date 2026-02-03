import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useFrequencias } from "@/hooks/useFrequencias";
import { FileText, Users, Building2, Calendar, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const { data: colaboradores = [] } = useColaboradores();
  const { data: orgaos = [] } = useOrgaos();
  const { data: frequencias = [] } = useFrequencias();

  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo).length;
  const colaboradoresInativos = colaboradores.filter((c) => !c.ativo).length;

  const stats = [
    {
      title: "Colaboradores Ativos",
      value: colaboradoresAtivos,
      description: `${colaboradoresInativos} inativos`,
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Órgãos Cadastrados",
      value: orgaos.length,
      description: "Unidades administrativas",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Frequências Geradas",
      value: frequencias.length,
      description: "Total de relatórios",
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const currentMonth = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Bem-vindo ao Sistema de Frequência
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie colaboradores e gere folhas de frequência mensal
          </p>
        </div>

        {/* Main CTA */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Gerar Frequência Mensal
                </h2>
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="card-institutional">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/colaboradores">
            <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" />
                  Colaboradores
                </CardTitle>
                <CardDescription>
                  Cadastrar e gerenciar servidores
                </CardDescription>
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
                <CardDescription>
                  Gerenciar unidades administrativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                  Acessar <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link to="/lotacoes">
            <Card className="card-institutional hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-primary" />
                  Lotações
                </CardTitle>
                <CardDescription>
                  Gerenciar locais de trabalho
                </CardDescription>
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
                <CardDescription>
                  Ver frequências geradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-primary group-hover:underline inline-flex items-center gap-1">
                  Acessar <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
