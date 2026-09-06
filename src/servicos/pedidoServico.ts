import { prisma } from "@/lib/prisma";
import type { CriarPedidoInput } from "@/lib/validacoes/pedido";
import { criarNotificacao } from "./notificacaoServico";

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
 * O pedido não pode ser cancelado (já foi atribuído, concluído ou
 * já não está aberto).
 */
export class PedidoNaoCancelavelError extends Error {
  constructor() {
    super("Este pedido não pode ser cancelado.");
    this.name = "PedidoNaoCancelavelError";
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
export async function listarPedidosDoArmador(armadorId: string, filtroEstado?: string) {
  const where: Record<string, unknown> = { armadorId };

  if (filtroEstado && ["ABERTO", "ATRIBUIDO", "CONCLUIDO", "CANCELADO"].includes(filtroEstado)) {
    where.estado = filtroEstado;
  }

  const pedidos = await prisma.pedido.findMany({
    where,
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
    select: { id: true, armadorId: true },
  });

  if (!pedido) {
    throw new PedidoNaoEncontradoError();
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoPedidoError();
  }

  // Escrita condicional: só conclui se, no momento exacto da escrita,
  // ainda estiver ATRIBUIDO. Consistente com o mesmo padrão usado em
  // aceitarProposta/cancelarPedido para evitar corridas de concorrência.
  const resultado = await prisma.pedido.updateMany({
    where: { id: pedidoId, estado: "ATRIBUIDO" },
    data: { estado: "CONCLUIDO" },
  });

  if (resultado.count === 0) {
    throw new PedidoNaoConcluivelError();
  }

  return prisma.pedido.findUniqueOrThrow({ where: { id: pedidoId } });
}

/**
 * Cancela um pedido. Só é possível enquanto estiver ABERTO (sem
 * proposta aceite). As propostas pendentes dos agentes passam a
 * RECUSADA, e cada agente é notificado.
 */
export async function cancelarPedido(pedidoId: string, armadorId: string) {
  const resultado = await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true, armadorId: true, navio: true },
    });

    if (!pedido) {
      throw new PedidoNaoEncontradoError();
    }

    if (pedido.armadorId !== armadorId) {
      throw new SemPermissaoPedidoError();
    }

    // Escrita condicional: a que resolve a corrida com
    // "aceitarProposta" -- se uma proposta for aceite entre a leitura
    // acima e este momento, o pedido ja nao esta ABERTO e esta escrita
    // nao afecta nenhuma linha (count === 0), pelo que o cancelamento
    // falha de forma limpa em vez de se sobrepor a uma atribuicao ja
    // confirmada.
    const cancelado = await tx.pedido.updateMany({
      where: { id: pedidoId, estado: "ABERTO" },
      data: { estado: "CANCELADO" },
    });

    if (cancelado.count === 0) {
      throw new PedidoNaoCancelavelError();
    }

    const propostasPendentes = await tx.proposta.findMany({
      where: { pedidoId, estado: "PENDENTE" },
      select: { id: true, agenteId: true },
    });

    if (propostasPendentes.length > 0) {
      await tx.proposta.updateMany({
        where: { pedidoId, estado: "PENDENTE" },
        data: { estado: "RECUSADA" },
      });
    }

    return { navio: pedido.navio, propostasPendentes };
  });

  // Notificacoes sao best effort -- o cancelamento ja esta confirmado
  // na base de dados nesta linha; uma falha ao notificar nao deve
  // devolver erro ao armador sobre uma operacao que ja foi bem-sucedida.
  for (const p of resultado.propostasPendentes) {
    try {
      await criarNotificacao({
        userId: p.agenteId,
        tipo: "PROPOSTA_RECUSADA",
        titulo: "Pedido cancelado",
        mensagem: `O pedido "${resultado.navio}" foi cancelado pelo armador. A sua proposta foi automaticamente recusada.`,
        pedidoId,
      });
    } catch (erro) {
      console.error("Falha ao notificar agente sobre cancelamento:", erro);
    }
  }
}
