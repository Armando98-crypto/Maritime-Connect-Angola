import { z } from "zod";

/**
 * Regras da senha: mínimo 8 caracteres. Não exigimos símbolos/maiúsculas
 * obrigatórias para não criar fricção desnecessária — o público-alvo
 * está habituado a WhatsApp, não a formulários corporativos.
 */
const senhaSchema = z
  .string()
  .min(8, "A palavra-passe deve ter pelo menos 8 caracteres");

const emailSchema = z
  .string()
  .min(1, "O email é obrigatório")
  .email("Introduza um email válido");

/**
 * Schema base, comum aos dois papéis.
 */
const registoBaseSchema = z.object({
  nome: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(120, "O nome é demasiado longo"),
  email: emailSchema,
  password: senhaSchema,
});

/**
 * Registo de armador: só precisa dos dados base.
 */
export const registoArmadorSchema = registoBaseSchema.extend({
  papel: z.literal("ARMADOR"),
});

/**
 * Registo de agente: precisa também da empresa e do número de licença,
 * que fica por verificar (licencaVerificada = false) até uma acção
 * manual na base de dados.
 */
export const registoAgenteSchema = registoBaseSchema.extend({
  papel: z.literal("AGENTE"),
  nomeEmpresa: z
    .string()
    .min(2, "O nome da empresa deve ter pelo menos 2 caracteres")
    .max(160, "O nome da empresa é demasiado longo"),
  numeroLicenca: z
    .string()
    .min(2, "Introduza o número de licença")
    .max(60, "O número de licença é demasiado longo"),
});

/**
 * Schema discriminado por "papel" — usado tanto no formulário de registo
 * como na API route, para garantir que o servidor nunca confia apenas
 * na validação do cliente.
 */
export const registoSchema = z.discriminatedUnion("papel", [
  registoArmadorSchema,
  registoAgenteSchema,
]);

export type RegistoInput = z.infer<typeof registoSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introduza a palavra-passe"),
});

export type LoginInput = z.infer<typeof loginSchema>;
