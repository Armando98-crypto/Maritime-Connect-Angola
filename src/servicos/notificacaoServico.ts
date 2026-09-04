import { prisma } from "@/lib/prisma";

export class SemPermissaoNotificacaoError extends Error {
  constructor() {
    super("Não tem permissão para aceder a esta notificação.");
    this.name = "SemPermissaoNotificacaoError";
  }
}

export class NotificacaoNaoEncontradaError extends Error {
  constructor() {
    super("A notificação não foi encontrada.");
    this.name = "NotificacaoNaoEncontradaError";
  }
}

export async function criarNotificacao(dados: {
  userId: string;
  tipo: "PROPOSTA_RECEBIDA" | "PROPOSTA_ACEITE" | "PROPOSTA_RECUSADA";
  titulo: string;
  mensagem: string;
  pedidoId?: string;
}) {
  return prisma.notificacao.create({ data: dados });
}

export async function listarNotificacoes(userId: string) {
  return prisma.notificacao.findMany({
    where: { userId },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      mensagem: true,
      lida: true,
      pedidoId: true,
      criadoEm: true,
    },
  });
}

export async function contarNaoLidas(userId: string) {
  return prisma.notificacao.count({
    where: { userId, lida: false },
  });
}

export async function marcarComoLida(notificacaoId: string, userId: string) {
  const notificacao = await prisma.notificacao.findUnique({
    where: { id: notificacaoId },
    select: { id: true, userId: true },
  });

  if (!notificacao) {
    throw new NotificacaoNaoEncontradaError();
  }

  if (notificacao.userId !== userId) {
    throw new SemPermissaoNotificacaoError();
  }

  return prisma.notificacao.update({
    where: { id: notificacaoId },
    data: { lida: true },
  });
}
