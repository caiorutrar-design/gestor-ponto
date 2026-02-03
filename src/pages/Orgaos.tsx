import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOrgaos, useCreateOrgao, useUpdateOrgao, useDeleteOrgao } from "@/hooks/useOrgaos";
import { Orgao } from "@/types/database";
import { Plus, Pencil, Trash2, Building2, Loader2 } from "lucide-react";

const OrgaosPage = () => {
  const { data: orgaos = [], isLoading } = useOrgaos();
  const createOrgao = useCreateOrgao();
  const updateOrgao = useUpdateOrgao();
  const deleteOrgao = useDeleteOrgao();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrgao, setEditingOrgao] = useState<Orgao | null>(null);
  const [formData, setFormData] = useState({ nome: "", sigla: "" });

  const resetForm = () => {
    setFormData({ nome: "", sigla: "" });
    setEditingOrgao(null);
  };

  const handleOpenDialog = (orgao?: Orgao) => {
    if (orgao) {
      setEditingOrgao(orgao);
      setFormData({ nome: orgao.nome, sigla: orgao.sigla || "" });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingOrgao) {
      await updateOrgao.mutateAsync({ id: editingOrgao.id, ...formData });
    } else {
      await createOrgao.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteOrgao.mutateAsync(id);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Órgãos</h1>
            <p className="text-muted-foreground">
              Gerencie os órgãos e unidades administrativas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Órgão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingOrgao ? "Editar Órgão" : "Novo Órgão"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrgao
                      ? "Atualize as informações do órgão"
                      : "Preencha os dados para cadastrar um novo órgão"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Órgão *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Secretaria de Educação"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) =>
                        setFormData({ ...formData, sigla: e.target.value })
                      }
                      placeholder="Ex: SEDUC"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createOrgao.isPending || updateOrgao.isPending}
                  >
                    {(createOrgao.isPending || updateOrgao.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingOrgao ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orgaos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Nenhum órgão cadastrado
            </h3>
            <p className="text-muted-foreground mt-1">
              Comece cadastrando seu primeiro órgão
            </p>
          </div>
        ) : (
          <div className="card-institutional overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgaos.map((orgao) => (
                  <TableRow key={orgao.id}>
                    <TableCell className="font-medium">{orgao.nome}</TableCell>
                    <TableCell>{orgao.sigla || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(orgao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o órgão "
                                {orgao.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(orgao.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

export default OrgaosPage;
