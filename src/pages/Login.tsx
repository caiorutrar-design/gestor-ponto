import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  identifier: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    const email = values.identifier.includes("@")
      ? values.identifier
      : `${values.identifier}@ponto.interno`;

    const { error } = await signIn(email, values.password);

    if (error) {
      const isMatricula = !values.identifier.includes("@");
      toast({
        title: "Erro ao entrar",
        description:
          error.message === "Invalid login credentials"
            ? isMatricula
              ? "Matrícula ou senha incorreta. Verifique se sua conta foi criada pelo administrador."
              : "Email ou senha incorretos."
            : error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleData?.role === "user") {
          const { data: colab } = await supabase
            .from("colaboradores")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (colab) {
            navigate("/meu-ponto");
            setLoading(false);
            return;
          }
        }
      }
    } catch {
      // Fallback to default redirect
    }

    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              Gestão de Frequência
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Entre para acessar o sistema
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ou Matrícula</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com ou matrícula"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              className="text-primary hover:underline font-medium"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
