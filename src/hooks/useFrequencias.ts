import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FrequenciaGerada } from "@/types/database";
import { toast } from "sonner";
import { mapSecurityError } from "@/lib/securityUtils";

export function useFrequencias() {
  return useQuery({
    queryKey: ["frequencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frequencias_geradas")
        .select("*, orgao:orgaos(*), lotacao:lotacoes(*)")
        .order("gerado_em", { ascending: false });
      
      if (error) throw error;
      return data as FrequenciaGerada[];
    },
  });
}

export function useCreateFrequencia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (frequencia: {
      mes: number;
      ano: number;
      orgao_id: string | null;
      lotacao_id: string | null;
      quantidade_colaboradores: number;
    }) => {
      const { data, error } = await supabase
        .from("frequencias_geradas")
        .insert(frequencia)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias"] });
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}

export function useUpdateFrequencia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: string;
      folha_assinada_url?: string;
      assinada_em?: string;
    }) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from("frequencias_geradas")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias"] });
    },
    onError: (error: Error) => {
      toast.error(mapSecurityError(error));
    },
  });
}
