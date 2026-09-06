import { z } from "zod";

export const atualizarPerfilAgenteSchema = z.object({
  nomeEmpresa: z
    .string()
    .min(2, "O nome da empresa deve ter pelo menos 2 caracteres.")
    .max(120, "O nome da empresa não pode ter mais de 120 caracteres."),
});

export type AtualizarPerfilAgenteInput = z.infer<typeof atualizarPerfilAgenteSchema>;
