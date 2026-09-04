import { z } from "zod";

/**
 * Compara apenas a componente de data (ignora hora) para decidir se
 * uma data está no passado. Evita rejeitar "hoje" só porque a hora
 * actual já passou da meia-noite do valor introduzido.
 */
function ehDataPassada(valorISO: string): boolean {
  const data = new Date(valorISO);
  if (Number.isNaN(data.getTime())) {
    return false; // erro de formato tratado por outra regra
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  return data.getTime() < hoje.getTime();
}

export const criarPedidoSchema = z.object({
  navio: z
    .string()
    .min(2, "O nome do navio deve ter pelo menos 2 caracteres")
    .max(120, "O nome do navio é demasiado longo"),
  dataPrevistaChegada: z
    .string()
    .min(1, "A data prevista de chegada é obrigatória")
    .refine((valor) => !Number.isNaN(Date.parse(valor)), {
      message: "Introduza uma data válida",
    })
    .refine((valor) => !ehDataPassada(valor), {
      message: "A data prevista de chegada não pode ser no passado",
    }),
  detalhes: z
    .string()
    .min(10, "Descreva com mais detalhe (mínimo 10 caracteres)")
    .max(2000, "Os detalhes são demasiado longos (máximo 2000 caracteres)"),
});

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;
