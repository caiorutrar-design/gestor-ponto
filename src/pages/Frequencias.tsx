import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFrequencias, useUpdateFrequencia } from "@/hooks/useFrequencias";
import { useColaboradores } from "@/hooks/useColaboradores";
import { regenerateFrequenciaPDF } from "@/utils/pdfGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Download, Upload, CheckCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const FrequenciasPage = () => {
  const { data: frequencias = [], isLoading } = useFrequencias();
  const { data: colaboradores = [] } = useColaboradores();
  const updateFrequencia = useUpdateFrequencia();
  const { toast } = useToast();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFrequencia, setSelectedFrequencia] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDownloadPDF = async (frequencia: typeof frequencias[0]) => {
    setDownloadingId(frequencia.id);

    try {
      // Filter colaboradores by orgao and lotacao
      let filteredColaboradores = colaboradores.filter(c => c.ativo);
      
      if (frequencia.orgao_id) {
        filteredColaboradores = filteredColaboradores.filter(
          c => c.orgao_id === frequencia.orgao_id
        );
      }
      
      if (frequencia.lotacao_id) {
        filteredColaboradores = filteredColaboradores.filter(
          c => c.lotacao_id === frequencia.lotacao_id
        );
      }

      if (filteredColaboradores.length === 0) {
        toast({
          title: "Sem colaboradores",
          description: "Não há colaboradores ativos para esta frequência.",
          variant: "destructive",
        });
        return;
      }

      const mesLabel = meses[frequencia.mes - 1];
      const orgaoNome = frequencia.orgao?.nome || "Todos os órgãos";

      await regenerateFrequenciaPDF(
        filteredColaboradores,
        frequencia.mes,
        frequencia.ano,
        mesLabel,
        orgaoNome
      );

      toast({
        title: "PDF baixado!",
        description: "A folha de frequência foi baixada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenUploadDialog = (frequenciaId: string) => {
    setSelectedFrequencia(frequenciaId);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem (JPEG, PNG, WebP) ou PDF.",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSignedSheet = async () => {
    if (!selectedFile || !selectedFrequencia) return;

    setUploadingFile(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedFrequencia}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('folhas-assinadas')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('folhas-assinadas')
        .getPublicUrl(fileName);

      await updateFrequencia.mutateAsync({
        id: selectedFrequencia,
        folha_assinada_url: publicUrl,
        assinada_em: new Date().toISOString(),
      });

      toast({
        title: "Folha anexada!",
        description: "A folha assinada foi anexada com sucesso.",
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedFrequencia(null);
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a folha assinada.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleViewSignedSheet = (url: string) => {
    window.open(url, '_blank');
  };

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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                    <TableCell className="text-center">
                      {frequencia.folha_assinada_url ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Assinada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(frequencia)}
                          disabled={downloadingId === frequencia.id}
                          className="gap-1"
                        >
                          {downloadingId === frequencia.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">PDF</span>
                        </Button>
                        
                        {frequencia.folha_assinada_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSignedSheet(frequencia.folha_assinada_url!)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenUploadDialog(frequencia.id)}
                            className="gap-1"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Anexar</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anexar Folha Assinada</DialogTitle>
              <DialogDescription>
                Faça o upload da folha de frequência digitalizada após ser assinada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo (PDF ou imagem)</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploadingFile}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPEG, PNG, WebP, PDF. Tamanho máximo: 10MB
                </p>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploadingFile}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadSignedSheet}
                disabled={!selectedFile || uploadingFile}
              >
                {uploadingFile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default FrequenciasPage;
