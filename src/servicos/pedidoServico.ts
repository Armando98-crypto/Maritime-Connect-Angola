import { prisma } from "@/lib/prisma";
import type { CriarPedidoInput } from "@/lib/validacoes/pedido";

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
