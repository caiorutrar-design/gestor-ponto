import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useRegistrosPonto, useDeleteRegistroPonto } from "@/hooks/useRegistrosPonto";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useLotacoes } from "@/hooks/useLotacoes";
import { Loader2, Download, Trash2, Clock } from "lucide-react";
import { format, subDays, differenceInMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const GerenciarPontosPage = () => {
  const { data: orgaos = [] } = useOrgaos();
  const { data: lotacoes = [] } = useLotacoes();
  const deleteRegistro = useDeleteRegistroPonto();

  const [orgaoId, setOrgaoId] = useState("all");
  const [lotacaoId, setLotacaoId] = useState("all");
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: registros = [], isLoading } = useRegistrosPonto({
    dataInicio,
    dataFim,
    orgaoId: orgaoId !== "all" ? orgaoId : undefined,
    lotacaoId: lotacaoId !== "all" ? lotacaoId : undefined,
  });

  const filteredLotacoes = orgaoId !== "all"
    ? lotacoes.filter((l) => l.orgao_id === orgaoId)
    : lotacoes;

  // Group records by colaborador + date for summary
  const summary = useMemo(() => {
    const map = new Map<string, { nome: string; matricula: string; data: string; registros: typeof registros }>();
    registros.forEach((r) => {
      const key = `${r.colaborador_id}_${r.data_registro}`;
      if (!map.has(key)) {
        map.set(key, {
          nome: r.colaborador?.nome_completo || "",
          matricula: r.colaborador?.matricula || "",
          data: r.data_registro,
          registros: [],
        });
      }
      map.get(key)!.registros.push(r);
    });

    return Array.from(map.values()).sort((a, b) => b.data.localeCompare(a.data));
  }, [registros]);

  const calcHorasTrabalhadas = (regs: typeof registros) => {
    const sorted = [...regs].sort((a, b) => a.timestamp_registro.localeCompare(b.timestamp_registro));
    let totalMinutes = 0;
    for (let i = 0; i < sorted.length - 1; i += 2) {
      if (sorted[i].tipo === "entrada" && sorted[i + 1]?.tipo === "saida") {
        totalMinutes += differenceInMinutes(
          parseISO(sorted[i + 1].timestamp_registro),
          parseISO(sorted[i].timestamp_registro)
        );
      }
    }
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m.toString().padStart(2, "0")}m`;
  };

  const exportCSV = () => {
    const headers = "Nome,Matrícula,Data,Entradas,Saídas,Horas Trabalhadas\n";
    const rows = summary.map((s) => {
      const entradas = s.registros.filter((r) => r.tipo === "entrada").map((r) => r.hora_registro).join("; ");
      const saidas = s.registros.filter((r) => r.tipo === "saida").map((r) => r.hora_registro).join("; ");
      return `"${s.nome}","${s.matricula}","${format(parseISO(s.data), "dd/MM/yyyy")}","${entradas}","${saidas}","${calcHorasTrabalhadas(s.registros)}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registros-ponto-${dataInicio}-a-${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Registros de Ponto</h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie os registros de ponto dos colaboradores</p>
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={summary.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Órgão</Label>
                <Select value={orgaoId} onValueChange={(v) => { setOrgaoId(v); setLotacaoId("all"); }}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {orgaos.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.sigla || o.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lotação</Label>
                <Select value={lotacaoId} onValueChange={setLotacaoId} disabled={orgaoId === "all"}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filteredLotacoes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : summary.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Nenhum registro encontrado no período selecionado.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>{s.matricula}</TableCell>
                      <TableCell>{format(parseISO(s.data), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.registros
                            .sort((a, b) => a.timestamp_registro.localeCompare(b.timestamp_registro))
                            .map((r) => (
                              <span key={r.id} className={`text-xs px-1.5 py-0.5 rounded ${
                                r.tipo === "entrada" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                              }`}>
                                {r.hora_registro?.substring(0, 5)} ({r.tipo === "entrada" ? "E" : "S"})
                              </span>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{calcHorasTrabalhadas(s.registros)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            s.registros.forEach((r) => deleteRegistro.mutate(r.id));
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default GerenciarPontosPage;
