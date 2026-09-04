import { prisma } from "@/lib/prisma";
import type { AtualizarPerfilAgenteInput } from "@/lib/validacoes/perfil";

export class PerfilNaoEncontradoError extends Error {
  constructor() {
    super("O perfil de agente não foi encontrado.");
    this.name = "PerfilNaoEncontradoError";
  }
}

export async function obterPerfilAgente(userId: string) {
  const perfil = await prisma.perfilAgente.findUnique({
    where: { userId },
    include: {
      user: {
        select: { nome: true, email: true, criadoEm: true },
      },
    },
  });

  return perfil;
}

export async function atualizarPerfilAgente(
  userId: string,
  dados: AtualizarPerfilAgenteInput
) {
  const perfil = await prisma.perfilAgente.findUnique({
    where: { userId },
  });

  if (!perfil) {
    throw new PerfilNaoEncontradoError();
  }

  return prisma.perfilAgente.update({
    where: { userId },
    data: { nomeEmpresa: dados.nomeEmpresa },
  });
}
