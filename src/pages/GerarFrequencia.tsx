import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useOrgaos } from "@/hooks/useOrgaos";
import { useLotacoes } from "@/hooks/useLotacoes";
import { useCreateFrequencia } from "@/hooks/useFrequencias";
import { generateFrequenciaPDF } from "@/utils/pdfGenerator";
import { Colaborador } from "@/types/database";
import { FileText, Loader2, Calendar, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const meses = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const currentYear = new Date().getFullYear();
const anos = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const GerarFrequenciaPage = () => {
  const { data: colaboradores = [], isLoading: loadingColaboradores } = useColaboradores({ apenasAtivos: true });
  const { data: orgaos = [] } = useOrgaos();
  const { data: lotacoes = [] } = useLotacoes();
  const createFrequencia = useCreateFrequencia();

  const currentMonth = new Date().getMonth() + 1;
  const [mes, setMes] = useState(currentMonth);
  const [ano, setAno] = useState(currentYear);
  const [orgaoId, setOrgaoId] = useState<string>("all");
  const [lotacaoId, setLotacaoId] = useState<string>("all");
  const [selectedColaboradores, setSelectedColaboradores] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredLotacoes = orgaoId && orgaoId !== "all"
    ? lotacoes.filter((l) => l.orgao_id === orgaoId)
    : lotacoes;

  const filteredColaboradores = colaboradores.filter((c) => {
    if (orgaoId && orgaoId !== "all" && c.orgao_id !== orgaoId) return false;
    if (lotacaoId && lotacaoId !== "all" && c.lotacao_id !== lotacaoId) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedColaboradores.length === filteredColaboradores.length) {
      setSelectedColaboradores([]);
    } else {
      setSelectedColaboradores(filteredColaboradores.map((c) => c.id));
    }
  };

  const handleToggleColaborador = (id: string) => {
    setSelectedColaboradores((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    const colaboradoresParaGerar = selectedColaboradores.length > 0
      ? colaboradores.filter((c) => selectedColaboradores.includes(c.id))
      : filteredColaboradores;

    if (colaboradoresParaGerar.length === 0) {
      toast.error("Selecione pelo menos um colaborador");
      return;
    }

    setIsGenerating(true);

    try {
      const mesLabel = meses.find((m) => m.value === mes)?.label || "";
      const orgaoNome = orgaoId && orgaoId !== "all"
        ? orgaos.find((o) => o.id === orgaoId)?.nome || ""
        : "";

      await generateFrequenciaPDF(colaboradoresParaGerar, mes, ano, mesLabel, orgaoNome);

      await createFrequencia.mutateAsync({
        mes,
        ano,
        orgao_id: orgaoId && orgaoId !== "all" ? orgaoId : null,
        lotacao_id: lotacaoId && lotacaoId !== "all" ? lotacaoId : null,
        quantidade_colaboradores: colaboradoresParaGerar.length,
      });

      toast.success(`PDF gerado com sucesso! ${colaboradoresParaGerar.length} folha(s) de frequência.`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const colaboradoresToShow = selectedColaboradores.length > 0
    ? colaboradores.filter((c) => selectedColaboradores.includes(c.id))
    : filteredColaboradores;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="text-2xl font-bold text-foreground">Gerar Frequência</h1>
          <p className="text-muted-foreground">
            Selecione o período e os colaboradores para gerar as folhas de frequência
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Filtros */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Período e Filtros
              </CardTitle>
              <CardDescription>
                Configure o período e filtros para geração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mes">Mês</Label>
                  <Select
                    value={mes.toString()}
                    onValueChange={(value) => setMes(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Select
                    value={ano.toString()}
                    onValueChange={(value) => setAno(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map((a) => (
                        <SelectItem key={a} value={a.toString()}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgao">Órgão</Label>
                <Select
                  value={orgaoId}
                  onValueChange={(value) => {
                    setOrgaoId(value);
                    setLotacaoId("all");
                    setSelectedColaboradores([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os órgãos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os órgãos</SelectItem>
                    {orgaos.map((orgao) => (
                      <SelectItem key={orgao.id} value={orgao.id}>
                        {orgao.sigla ? `${orgao.sigla} - ${orgao.nome}` : orgao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lotacao">Lotação</Label>
                <Select
                  value={lotacaoId}
                  onValueChange={(value) => {
                    setLotacaoId(value);
                    setSelectedColaboradores([]);
                  }}
                  disabled={orgaoId === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as lotações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lotações</SelectItem>
                    {filteredLotacoes.map((lotacao) => (
                      <SelectItem key={lotacao.id} value={lotacao.id}>
                        {lotacao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Colaboradores</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={filteredColaboradores.length === 0}
                  >
                    {selectedColaboradores.length === filteredColaboradores.length
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </Button>
                </div>

                {loadingColaboradores ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredColaboradores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum colaborador ativo encontrado
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredColaboradores.map((colaborador) => (
                      <div
                        key={colaborador.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={colaborador.id}
                          checked={selectedColaboradores.includes(colaborador.id)}
                          onCheckedChange={() => handleToggleColaborador(colaborador.id)}
                        />
                        <label
                          htmlFor={colaborador.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {colaborador.nome_completo}
                          <span className="text-muted-foreground ml-2">
                            ({colaborador.matricula})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Resumo da Geração
              </CardTitle>
              <CardDescription>
                {colaboradoresToShow.length} folha(s) de frequência serão geradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Mês/Ano</p>
                    <p className="text-lg font-semibold">
                      {meses.find((m) => m.value === mes)?.label} / {ano}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Órgão</p>
                    <p className="text-lg font-semibold">
                      {orgaoId !== "all"
                        ? orgaos.find((o) => o.id === orgaoId)?.sigla ||
                          orgaos.find((o) => o.id === orgaoId)?.nome ||
                          "N/A"
                        : "Todos"}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Lotação</p>
                    <p className="text-lg font-semibold">
                      {lotacaoId !== "all"
                        ? lotacoes.find((l) => l.id === lotacaoId)?.nome || "N/A"
                        : "Todas"}
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4">
                    <p className="text-sm text-primary">Total de Folhas</p>
                    <p className="text-2xl font-bold text-primary">
                      {colaboradoresToShow.length}
                    </p>
                  </div>
                </div>

                {colaboradoresToShow.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b">
                      <span className="text-sm font-medium">
                        Colaboradores selecionados
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {colaboradoresToShow.map((colaborador, index) => (
                        <div
                          key={colaborador.id}
                          className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0 hover:bg-muted/30"
                        >
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm flex-1">
                            {colaborador.nome_completo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {colaborador.matricula}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || colaboradoresToShow.length === 0}
                  size="lg"
                  className="w-full gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Gerar PDF de Frequência
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default GerarFrequenciaPage;
