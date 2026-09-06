import { z } from "zod";

/**
 * Schema da proposta que um agente envia para um pedido aberto.
 *
 * `preco` é o valor (em Kz) que o agente cobra pelo serviço de
 * agenciamento; `prazoDias` é o prazo em dias dentro do qual se
 * compromete a prestar o serviço após a chegada do navio.
 */
export const criarPropostaSchema = z.object({
  pedidoId: z.string().min(1, "O pedido é obrigatório"),
  preco: z
    .number()
    .positive("O preço deve ser um valor positivo")
    .max(1_000_000_000, "O preço é demasiado alto"),
  prazoDias: z
    .number()
    .int("O prazo deve ser um número inteiro de dias")
    .positive("O prazo deve ser de pelo menos 1 dia")
    .max(365, "O prazo não pode exceder 365 dias"),
});

export type CriarPropostaInput = z.infer<typeof criarPropostaSchema>;
