import { prisma } from "@/lib/prisma";
import type { CriarPropostaInput } from "@/lib/validacoes/proposta";

/**
 * O pedido não existe, não está aberto (já foi atribuído/concluído/
 * cancelado) ou já tem uma proposta aceite — em qualquer caso não aceita
 * novas propostas.
 */
export class PedidoIndisponivelError extends Error {
  constructor() {
    super(
      "Este pedido já não aceita propostas (pode ter sido atribuído, concluído ou cancelado)."
    );
    this.name = "PedidoIndisponivelError";
  }
}

/**
 * O agente é dono do próprio pedido. Não faz sentido um armador propor
 * o seu próprio pedido como se fosse um agente terceiro.
 */
export class ProprioPedidoError extends Error {
  constructor() {
    super("Não pode enviar uma proposta para o seu próprio pedido.");
    this.name = "ProprioPedidoError";
  }
}

/**
 * O agente já enviou uma proposta para este pedido. Evita spam e
 * duplicados — um pedido só precisa de uma proposta por agente.
 */
export class PropostaDuplicadaError extends Error {
  constructor() {
    super("Já enviou uma proposta para este pedido.");
    this.name = "PropostaDuplicadaError";
  }
}

/**
 * Envia uma proposta de um agente para um pedido aberto.
 *
 * Desenha as propostas como "às cegas" na fase actual: o agente vê o
 * pedido (navio, data, detalhes) mas não as propostas dos concorrentes
 * — cada um faz a sua oferta sem saber o que os outros oferecem.
 *
 * Validações de domínio feitas aqui, antes de gravar:
 *  - o pedido tem de existir e estar ABERTO (e ainda sem proposta aceite);
 *  - o agente não pode propor o seu próprio pedido;
 *  - o agente não pode enviar duas propostas para o mesmo pedido.
 */
export async function criarProposta(
  agenteId: string,
  dados: CriarPropostaInput
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: dados.pedidoId },
  });

  if (!pedido || pedido.estado !== "ABERTO" || pedido.propostaAceiteId) {
    throw new PedidoIndisponivelError();
  }

  if (pedido.armadorId === agenteId) {
    throw new ProprioPedidoError();
  }

  const jaEnviada = await prisma.proposta.findFirst({
    where: { pedidoId: dados.pedidoId, agenteId },
  });

  if (jaEnviada) {
    throw new PropostaDuplicadaError();
  }

  return prisma.proposta.create({
    data: {
      pedidoId: dados.pedidoId,
      agenteId,
      preco: dados.preco,
      prazoDias: dados.prazoDias,
    },
  });
}

/**
 * Lista os pedidos abertos de todos os armadores — é o "quadro" que o
 * agente vê para escolher onde enviar propostas. Mais recentes primeiro,
 * e com a contagem de propostas para dar uma ideia de concorrência.
 *
 * Nota: nesta fase o agente vê todos os pedidos abertos. A distinção
 * por nicho/porto fica para uma iteração futura — ver decisão no schema.
 */
export async function listarPedidosAbertosParaAgente() {
  return prisma.pedido.findMany({
    where: { estado: "ABERTO" },
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { propostas: true } },
    },
  });
}

/**
 * Lista as propostas já enviadas por um agente, com o pedido associado,
 * para o agente ver o estado das suas ofertas.
 */
export async function listarPropostasDoAgente(agenteId: string) {
  return prisma.proposta.findMany({
    where: { agenteId },
    orderBy: { criadoEm: "desc" },
    include: { pedido: true },
  });
}

/**
 * Carrega um pedido para a página de "enviar proposta", mas só se ainda
 * estiver aberto. Devolve `null` se não existir ou se já não aceitar
 * propostas — a página decide como reagir.
 */
export async function obterPedidoAbertoParaAgente(pedidoId: string) {
  return prisma.pedido.findFirst({
    where: { id: pedidoId, estado: "ABERTO" },
  });
}
