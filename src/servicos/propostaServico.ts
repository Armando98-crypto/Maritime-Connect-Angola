import { prisma } from "@/lib/prisma";
import type { CriarPropostaInput } from "@/lib/validacoes/proposta";
import { PERCENTAGEM_COMISSAO, calcularValorComissao } from "./comissaoServico";
import { criarNotificacao } from "./notificacaoServico";

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
 * O armador tentou aceder a um pedido que não lhe pertence — ou a uma
 * proposta que não pertence a um dos seus pedidos.
 */
export class SemPermissaoError extends Error {
  constructor() {
    super("Não tem permissão para aceder a este pedido.");
    this.name = "SemPermissaoError";
  }
}

/**
 * O pedido (ou a proposta) pedido pelo armador não existe.
 */
export class NaoEncontradoError extends Error {
  constructor() {
    super("O recurso pedido não foi encontrado.");
    this.name = "NaoEncontradoError";
  }
}

/**
 * O pedido já não está aberto para aceitar/recusar propostas (já foi
 * atribuído a um agente, concluído ou cancelado).
 */
export class PedidoFechadoError extends Error {
  constructor() {
    super("Este pedido já não aceita alterações às propostas.");
    this.name = "PedidoFechadoError";
  }
}

/**
 * A proposta já foi decidida (aceite ou recusada) — não pode voltar a
 * ser alterada.
 */
export class PropostaJaDecididaError extends Error {
  constructor() {
    super("Esta proposta já foi decidida.");
    this.name = "PropostaJaDecididaError";
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

  const proposta = await prisma.proposta.create({
    data: {
      pedidoId: dados.pedidoId,
      agenteId,
      preco: dados.preco,
      prazoDias: dados.prazoDias,
    },
  });

  await criarNotificacao({
    userId: pedido.armadorId,
    tipo: "PROPOSTA_RECEBIDA",
    titulo: "Nova proposta recebida",
    mensagem: `Um agente enviou uma proposta para o pedido "${pedido.navio}".`,
    pedidoId: pedido.id,
  });

  return proposta;
}

/**
 * Lista os pedidos abertos de todos os armadores — é o "quadro" que o
 * agente vê para escolher onde enviar propostas. Mais recentes primeiro,
 * e com a contagem de propostas para dar uma ideia de concorrência.
 *
 * Nota: nesta fase o agente vê todos os pedidos abertos. A distinção
 * por nicho/porto fica para uma iteração futura — ver decisão no schema.
 */
export async function listarPedidosAbertosParaAgente(busca?: string) {
  const where: Record<string, unknown> = { estado: "ABERTO" };

  if (busca && busca.trim().length > 0) {
    where.navio = { contains: busca.trim(), mode: "insensitive" };
  }

  return prisma.pedido.findMany({
    where,
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

/**
 * Lista as propostas recebidas de um pedido do armador, com o nome da
 * empresa do agente que as enviou. Só devolve as propostas se o pedido
 * pertencer ao armador indicado; caso contrário lança SemPermissaoError.
 */
export async function listarPropostasDePedido(pedidoId: string, armadorId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, armadorId: true },
  });

  if (!pedido) {
    throw new NaoEncontradoError();
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoError();
  }

  return prisma.proposta.findMany({
    where: { pedidoId },
    orderBy: { criadoEm: "asc" },
    include: {
      agente: {
        select: {
          nome: true,
          perfilAgente: { select: { nomeEmpresa: true } },
        },
      },
    },
  });
}

/**
 * Carrega um pedido do armador juntamente com as propostas recebidas,
 * para a página de gestão. Devolve `null` se não existir e lança
 * SemPermissaoError se o pedido não pertencer ao armador.
 */
export async function obterPedidoComPropostas(pedidoId: string, armadorId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      propostaAceite: {
        select: { id: true, preco: true, prazoDias: true, agenteId: true },
      },
      avaliacao: true,
      comissao: true,
      propostas: {
        orderBy: { criadoEm: "asc" },
        include: {
          agente: {
            select: {
              nome: true,
              perfilAgente: { select: { nomeEmpresa: true } },
            },
          },
        },
      },
    },
  });

  if (!pedido) {
    return null;
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoError();
  }

  return pedido;
}

/**
 * Aceita a proposta escolhida pelo armador. Efeitos, num passo atómico:
 *  - a proposta escolhida passa a ACEITE;
 *  - o pedido passa a ATRIBUIDO e fica ligado à proposta aceite;
 *  - todas as restantes propostas pendentes passam a RECUSADA;
 *  - gera a comissão da plataforma (valor base = preço, percentagem fixa).
 *
 * Só é possível enquanto o pedido está ABERTO e a proposta ainda está
 * PENDENTE. O armador tem de ser dono do pedido.
 */
export async function aceitarProposta(
  pedidoId: string,
  propostaId: string,
  armadorId: string
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, armadorId: true, estado: true, propostaAceiteId: true, navio: true },
  });

  if (!pedido) {
    throw new NaoEncontradoError();
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoError();
  }

  if (pedido.estado !== "ABERTO" || pedido.propostaAceiteId) {
    throw new PedidoFechadoError();
  }

  const proposta = await prisma.proposta.findUnique({
    where: { id: propostaId },
    select: { id: true, pedidoId: true, estado: true, preco: true, agenteId: true },
  });

  if (!proposta || proposta.pedidoId !== pedidoId) {
    throw new NaoEncontradoError();
  }

  if (proposta.estado !== "PENDENTE") {
    throw new PropostaJaDecididaError();
  }

  const valorBase = Number(proposta.preco);

  const resultado = await prisma.$transaction([
    prisma.proposta.update({
      where: { id: propostaId },
      data: { estado: "ACEITE" },
    }),
    prisma.proposta.updateMany({
      where: { pedidoId, id: { not: propostaId }, estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    }),
    prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: "ATRIBUIDO", propostaAceiteId: propostaId },
    }),
    prisma.comissao.create({
      data: {
        pedidoId,
        valorBase,
        percentagem: PERCENTAGEM_COMISSAO,
        valorComissao: calcularValorComissao(valorBase),
      },
    }),
  ]);

  await criarNotificacao({
    userId: proposta.agenteId,
    tipo: "PROPOSTA_ACEITE",
    titulo: "Proposta aceite",
    mensagem: `A sua proposta para o pedido "${pedido.navio}" foi aceite pelo armador.`,
    pedidoId,
  });

  return resultado;
}

/**
 * Recusa uma proposta. Só é possível enquanto o pedido está ABERTO e a
 * proposta ainda está PENDENTE. O armador tem de ser dono do pedido.
 */
export async function recusarProposta(
  pedidoId: string,
  propostaId: string,
  armadorId: string
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { id: true, armadorId: true, estado: true, propostaAceiteId: true, navio: true },
  });

  if (!pedido) {
    throw new NaoEncontradoError();
  }

  if (pedido.armadorId !== armadorId) {
    throw new SemPermissaoError();
  }

  if (pedido.estado !== "ABERTO" || pedido.propostaAceiteId) {
    throw new PedidoFechadoError();
  }

  const proposta = await prisma.proposta.findUnique({
    where: { id: propostaId },
    select: { id: true, pedidoId: true, estado: true, agenteId: true },
  });

  if (!proposta || proposta.pedidoId !== pedidoId) {
    throw new NaoEncontradoError();
  }

  if (proposta.estado !== "PENDENTE") {
    throw new PropostaJaDecididaError();
  }

  const resultado = await prisma.proposta.update({
    where: { id: propostaId },
    data: { estado: "RECUSADA" },
  });

  await criarNotificacao({
    userId: proposta.agenteId,
    tipo: "PROPOSTA_RECUSADA",
    titulo: "Proposta recusada",
    mensagem: `A sua proposta para o pedido "${pedido.navio}" foi recusada pelo armador.`,
    pedidoId,
  });

  return resultado;
}
