import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveTable, MobileCardList, MobileCard, MobileCardHeader, MobileCardRow, MobileCardActions,
} from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Users, Shield, ShieldCheck, User, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  nome_completo: string | null;
  role: string | null;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  user: "Usuário Comum",
};

const roleBadgeVariant = (role: string | null) => {
  switch (role) {
    case "super_admin": return "destructive" as const;
    case "admin": return "default" as const;
    default: return "secondary" as const;
  }
};

const GerenciamentoUsuarios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "", email: "", password: "", role: "user", departamento: "",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*");
      if (error) throw error;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      if (rolesError) throw rolesError;

      return profiles.map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          email: p.email,
          nome_completo: p.nome_completo,
          role: userRole?.role || null,
          created_at: p.created_at,
        } as UserWithRole;
      });
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: data,
      });
      if (error) throw new Error(error.message || "Erro ao criar usuário");
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setIsDialogOpen(false);
      setFormData({ nome: "", email: "", password: "", role: "user", departamento: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Remove role first
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Papel do usuário removido" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as "admin" | "user" })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as "admin" | "user" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Papel atualizado" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData);
  };

  const RoleIcon = ({ role }: { role: string | null }) => {
    switch (role) {
      case "super_admin": return <ShieldCheck className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-sm text-muted-foreground">Crie e gerencie usuários e seus níveis de acesso</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>Preencha os dados para criar um novo usuário no sistema</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Papel *</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador (RH)</SelectItem>
                        <SelectItem value="user">Usuário Comum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createUser.isPending} className="w-full sm:w-auto">
                    {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Usuário
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum usuário encontrado</h3>
          </div>
        ) : (
          <>
            <MobileCardList>
              {users.map((u) => (
                <MobileCard key={u.id}>
                  <MobileCardHeader
                    title={u.nome_completo || "Sem nome"}
                    subtitle={u.email || ""}
                    badge={
                      <Badge variant={roleBadgeVariant(u.role)} className="gap-1">
                        <RoleIcon role={u.role} />
                        {roleLabels[u.role || ""] || "Sem papel"}
                      </Badge>
                    }
                  />
                  <MobileCardRow label="Criado em" value={new Date(u.created_at).toLocaleDateString("pt-BR")} />
                  {u.role !== "super_admin" && (
                    <MobileCardActions>
                      <Select
                        value={u.role || ""}
                        onValueChange={(v) => updateRole.mutate({ userId: u.user_id, newRole: v })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Alterar papel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="user">Usuário Comum</SelectItem>
                        </SelectContent>
                      </Select>
                    </MobileCardActions>
                  )}
                </MobileCard>
              ))}
            </MobileCardList>

            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome_completo || "Sem nome"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)} className="gap-1">
                          <RoleIcon role={u.role} />
                          {roleLabels[u.role || ""] || "Sem papel"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        {u.role !== "super_admin" ? (
                          <Select
                            value={u.role || ""}
                            onValueChange={(v) => updateRole.mutate({ userId: u.user_id, newRole: v })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Alterar papel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="user">Usuário Comum</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">Protegido</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default GerenciamentoUsuarios;
