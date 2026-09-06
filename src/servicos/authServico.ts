import bcrypt from "bcryptjs";
import { Prisma, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RegistoInput } from "@/lib/validacoes/auth";

const SALT_ROUNDS = 12;

/**
 * Erros de domínio específicos, para que a API route e a UI possam
 * mostrar uma mensagem clara em vez de um erro 500 genérico.
 */
export class EmailJaExisteError extends Error {
  constructor() {
    super("Já existe uma conta registada com este email.");
    this.name = "EmailJaExisteError";
  }
}

export class LicencaJaExisteError extends Error {
  constructor() {
    super("Já existe um agente registado com este número de licença.");
    this.name = "LicencaJaExisteError";
  }
}

export type UtilizadorCriado = Pick<User, "id" | "nome" | "email" | "papel">;

/**
 * Cria um novo utilizador (armador ou agente).
 *
 * Caso limite tratado: dois pedidos de registo com o mesmo email (ou,
 * para agentes, o mesmo número de licença) a chegar quase em simultâneo.
 * A verificação prévia por si só não chega — entre o "SELECT" e o
 * "INSERT" outro pedido pode ter passado. Por isso confiamos, em última
 * instância, na constraint UNIQUE da base de dados: se ela disparar
 * (código Prisma P2002), traduzimos para o mesmo erro de domínio que a
 * verificação prévia teria dado, em vez de deixar rebentar um erro 500.
 */
export async function criarUtilizador(
  dados: RegistoInput
): Promise<UtilizadorCriado> {
  const passwordHash = await bcrypt.hash(dados.password, SALT_ROUNDS);

  try {
    if (dados.papel === "ARMADOR") {
      const user = await prisma.user.create({
        data: {
          nome: dados.nome,
          email: dados.email.toLowerCase(),
          passwordHash,
          papel: "ARMADOR",
        },
        select: { id: true, nome: true, email: true, papel: true },
      });
      return user;
    }

    // Agente: cria User + PerfilAgente atomicamente. Se o segundo passo
    // falhar (ex.: licença duplicada), o primeiro é revertido — nunca
    // fica um User "agente" sem PerfilAgente associado.
    const user = await prisma.$transaction(async (tx) => {
      const novoUser = await tx.user.create({
        data: {
          nome: dados.nome,
          email: dados.email.toLowerCase(),
          passwordHash,
          papel: "AGENTE",
        },
      });

      await tx.perfilAgente.create({
        data: {
          userId: novoUser.id,
          nomeEmpresa: dados.nomeEmpresa,
          numeroLicenca: dados.numeroLicenca,
          licencaVerificada: false,
        },
      });

      return novoUser;
    });

    return { id: user.id, nome: user.nome, email: user.email, papel: user.papel };
  } catch (erro) {
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      const alvo = (erro.meta?.target as string[] | undefined) ?? [];
      if (alvo.includes("email")) {
        throw new EmailJaExisteError();
      }
      if (alvo.includes("numeroLicenca")) {
        throw new LicencaJaExisteError();
      }
    }
    throw erro;
  }
}

/**
 * Verifica as credenciais de login. Devolve o utilizador se forem
 * válidas, ou `null` caso contrário — nunca revela se foi o email ou a
 * palavra-passe que falhou, para não ajudar um atacante a enumerar
 * contas existentes.
 */
export async function verificarCredenciais(
  email: string,
  password: string
): Promise<Pick<User, "id" | "nome" | "email" | "papel" | "isAdmin"> | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return null;
  }

  const senhaValida = await bcrypt.compare(password, user.passwordHash);
  if (!senhaValida) {
    return null;
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    isAdmin: user.isAdmin,
  };
}
