import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CriarAvaliacaoInput } from "@/lib/validacoes/avaliacao";

/**
 * O armador tentou avaliar um pedido que não lhe pertence.
 */
export class SemPermissaoAvaliacaoError extends Error {
  constructor() {
    super("Não tem permissão para avaliar este pedido.");
    this.name = "SemPermissaoAvaliacaoError";
  }
}

/**
 * O pedido (ou a proposta aceite associada) não existe.
 */
export class AvaliacaoNaoEncontradaError extends Error {
  constructor() {
    super("O pedido não foi encontrado.");
    this.name = "AvaliacaoNaoEncontradaError";
  }
}

/**
 * O pedido ainda não está CONCLUIDO — só se avalia um serviço depois
 * de concluído.
 */
export class PedidoNaoConcluidoError extends Error {
  constructor() {
    super("Só pode avaliar depois de o pedido estar concluído.");
    this.name = "PedidoNaoConcluidoError";
  }
}

/**
 * O pedido não tem um agente atribuído (proposta aceite) — não há a
 * quem atribuir a avaliação.
 */
export class PedidoSemAgenteError extends Error {
  constructor() {
    super("Este pedido não tem um agente atribuído para avaliar.");
    this.name = "PedidoSemAgenteError";
  }
}

/**
 * O pedido já foi avaliado — uma avaliação por pedido.
 */
export class AvaliacaoDuplicadaError extends Error {
  constructor() {
    super("Este pedido já foi avaliado.");
    this.name = "AvaliacaoDuplicadaError";
  }
}

/**
 * Avalia o agente que prestou o serviço de um pedido já concluído.
 *
 * Regras de domínio:
 *  - o pedido tem de pertencer ao armador que avalia;
 *  - o pedido tem de estar CONCLUIDO;
 *  - o pedido tem de ter uma proposta aceite (o agente a avaliar);
 *  - um pedido só pode ser avaliado uma vez.
 */
export async function avaliarPedido(
  pedidoId: string,
  armadorId: string,
  dados: CriarAvaliacaoInput
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      armadorId: true,
      estado: true,
      propostaAceiteId: true,
      avaliacao: { select: { id: true } },
    },
  });

  if (!pedido) {
    throw new AvaliacaoNaoEncontradaError();
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoAvaliacaoError();
  }

  if (pedido.estado !== "CONCLUIDO") {
    throw new PedidoNaoConcluidoError();
  }

  if (!pedido.propostaAceiteId) {
    throw new PedidoSemAgenteError();
  }

  if (pedido.avaliacao) {
    throw new AvaliacaoDuplicadaError();
  }

  const propostaAceite = await prisma.proposta.findUnique({
    where: { id: pedido.propostaAceiteId },
    select: { agenteId: true },
  });

  if (!propostaAceite) {
    throw new PedidoSemAgenteError();
  }

  try {
    return await prisma.avaliacao.create({
      data: {
        pedidoId: pedido.id,
        agenteId: propostaAceite.agenteId,
        nota: dados.nota,
        comentario: dados.comentario ?? null,
      },
    });
  } catch (erro) {
    // Caso limite (corrida): duplo-clique em "avaliar", ou duas abas —
    // a leitura de `pedido.avaliacao` acima pode não apanhar a corrida,
    // mas a constraint UNIQUE(pedidoId) da base de dados apanha sempre.
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new AvaliacaoDuplicadaError();
    }
    throw erro;
  }
}

/**
 * Lista as avaliações recebidas por um agente (nos pedidos onde foi o
 * escolhido), com o navio de cada pedido. Para o agente ver a sua
 * reputação.
 */
export async function listarAvaliacoesRecebidas(agenteId: string) {
  return prisma.avaliacao.findMany({
    where: { agenteId },
    orderBy: { criadoEm: "desc" },
    include: { pedido: { select: { id: true, navio: true } } },
  });
}

/**
 * Devolve a avaliação de um pedido, se existir. Usado para o armador
 * saber se já avaliou (e mostrar a avaliação feita). `null` se ainda
 * não houver avaliação.
 */
export async function obterAvaliacaoDoPedido(pedidoId: string) {
  return prisma.avaliacao.findUnique({
    where: { pedidoId },
  });
}