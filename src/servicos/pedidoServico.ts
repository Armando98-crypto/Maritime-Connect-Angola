import { prisma } from "@/lib/prisma";
import type { CriarPedidoInput } from "@/lib/validacoes/pedido";

/**
 * O armador tentou concluir um pedido que não lhe pertence.
 */
export class SemPermissaoPedidoError extends Error {
  constructor() {
    super("Não tem permissão para aceder a este pedido.");
    this.name = "SemPermissaoPedidoError";
  }
}

/**
 * O pedido pedido não existe.
 */
export class PedidoNaoEncontradoError extends Error {
  constructor() {
    super("O pedido não foi encontrado.");
    this.name = "PedidoNaoEncontradoError";
  }
}

/**
 * O pedido ainda não está ATRIBUIDO a um agente, ou já não está num
 * estado que permita concluí-lo.
 */
export class PedidoNaoConcluivelError extends Error {
  constructor() {
    super("O pedido ainda não está pronto a concluir.");
    this.name = "PedidoNaoConcluivelError";
  }
}

/**
 * Cria um pedido para o armador indicado. O estado começa sempre em
 * ABERTO (default do schema) — não há forma de um pedido nascer já
 * ATRIBUIDO ou CONCLUIDO.
 *
 * Nota sobre o porto: propositadamente não existe campo `porto` aqui.
 * Nesta fase só existe o Porto do Namibe, e o nome aparece fixo na UI
 * — ver a decisão registada no schema Prisma.
 */
export async function criarPedido(armadorId: string, dados: CriarPedidoInput) {
  return prisma.pedido.create({
    data: {
      armadorId,
      navio: dados.navio,
      dataPrevistaChegada: new Date(dados.dataPrevistaChegada),
      detalhes: dados.detalhes,
    },
  });
}

/**
 * Lista os pedidos de um armador, mais recentes primeiro, incluindo
 * quantas propostas cada um já recebeu — informação útil para o
 * armador perceber, de relance, se algum pedido precisa de atenção.
 */
export async function listarPedidosDoArmador(armadorId: string) {
  const pedidos = await prisma.pedido.findMany({
    where: { armadorId },
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { propostas: true } },
    },
  });

  return pedidos;
}

/**
 * Marca um pedido como CONCLUIDO. Só é possível se o pedido pertencer
 * ao armador e estiver num estado ATRIBUIDO (já tem agente escolhido).
 * Depois de concluído o armador pode avaliar o agente.
 */
export async function concluirPedido(pedidoId: string, armadorId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, armadorId: true, estado: true },
  });

  if (!pedido) {
    throw new PedidoNaoEncontradoError();
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoPedidoError();
  }

  if (pedido.estado !== "ATRIBUIDO") {
    throw new PedidoNaoConcluivelError();
  }

  return prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: "CONCLUIDO" },
  });
}
