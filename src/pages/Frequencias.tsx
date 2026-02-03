import { AppLayout } from "@/components/layout/AppLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFrequencias } from "@/hooks/useFrequencias";
import { FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const FrequenciasPage = () => {
  const { data: frequencias = [], isLoading } = useFrequencias();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="text-2xl font-bold text-foreground">Frequências Geradas</h1>
          <p className="text-muted-foreground">
            Histórico de todas as folhas de frequência geradas
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : frequencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhuma frequência gerada
            </h3>
            <p className="text-muted-foreground mt-1">
              As frequências geradas aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="card-institutional overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Lotação</TableHead>
                  <TableHead className="text-center">Colaboradores</TableHead>
                  <TableHead>Data de Geração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frequencias.map((frequencia) => (
                  <TableRow key={frequencia.id}>
                    <TableCell className="font-medium">
                      {meses[frequencia.mes - 1]} / {frequencia.ano}
                    </TableCell>
                    <TableCell>
                      {frequencia.orgao?.sigla || frequencia.orgao?.nome || "Todos"}
                    </TableCell>
                    <TableCell>
                      {frequencia.lotacao?.nome || "Todas"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                        {frequencia.quantidade_colaboradores}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(frequencia.gerado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FrequenciasPage;
