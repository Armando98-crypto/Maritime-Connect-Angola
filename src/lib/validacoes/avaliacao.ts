import { z } from "zod";

/**
 * Schema da avaliação que um armador deixa para o agente que prestou o
 * serviço, uma vez o pedido concluído. `nota` é de 1 a 5; `comentario` é
 * opcional mas limitado em tamanho.
 */
export const criarAvaliacaoSchema = z.object({
  nota: z
    .number()
    .int("A nota deve ser um número inteiro")
    .min(1, "A nota mínima é 1")
    .max(5, "A nota máxima é 5"),
  comentario: z
    .string()
    .max(500, "O comentário é demasiado longo (máximo 500 caracteres)")
    .optional()
    .nullable(),
});

export type CriarAvaliacaoInput = z.infer<typeof criarAvaliacaoSchema>;
