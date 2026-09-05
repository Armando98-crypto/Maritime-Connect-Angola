import { Prisma } from "@prisma/client";
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
 * O agente não tem perfil de agente associado (não devia acontecer —
 * todo o utilizador com papel AGENTE ganha um PerfilAgente no registo —
 * mas tratamos explicitamente em vez de deixar rebentar mais à frente).
 */
export class AgenteSemPerfilError extends Error {
  constructor() {
    super("Não foi possível encontrar o seu perfil de agente.");
    this.name = "AgenteSemPerfilError";
  }
}

/**
 * O agente ainda não tem a licença verificada por um administrador.
 * Bloqueado com explicação — nunca escondido silenciosamente.
 */
export class LicencaNaoVerificadaError extends Error {
  constructor() {
    super(
      "A sua licença ainda não foi verificada. Só pode enviar propostas depois de a verificação ser concluída."
    );
    this.name = "LicencaNaoVerificadaError";
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
 *  - o agente tem de ter a licença verificada;
 *  - o pedido tem de existir e estar ABERTO (e ainda sem proposta aceite);
 *  - o agente não pode propor o seu próprio pedido;
 *  - o agente não pode enviar duas propostas para o mesmo pedido.
 *
 * Caso limite (corrida de concorrência): entre o momento em que
 * confirmamos que o pedido está ABERTO e o momento em que a proposta é
 * de facto gravada, outra operação (aceitar uma proposta concorrente,
 * ou cancelar o pedido) pode fechá-lo. Para não criar uma proposta
 * "zombie" presa a um pedido já fechado, tudo corre dentro de UMA
 * transacção que inclui uma escrita condicional sobre o próprio pedido
 * — ver comentário mais abaixo.
 */
export async function criarProposta(agenteId: string, dados: CriarPropostaInput) {
  const perfil = await prisma.perfilAgente.findUnique({
    where: { userId: agenteId },
    select: { licencaVerificada: true },
  });

  if (!perfil) {
    throw new AgenteSemPerfilError();
  }

  if (!perfil.licencaVerificada) {
    throw new LicencaNaoVerificadaError();
  }

  let resultado;

  try {
    resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: dados.pedidoId },
        select: { id: true, estado: true, propostaAceiteId: true, armadorId: true, navio: true },
      });

      if (!pedido || pedido.estado !== "ABERTO" || pedido.propostaAceiteId) {
        throw new PedidoIndisponivelError();
      }

      if (pedido.armadorId === agenteId) {
        throw new ProprioPedidoError();
      }

      // Escrita condicional: não muda nada de facto (grava o mesmo
      // estado que já tinha), mas obriga o Postgres a re-confirmar, no
      // preciso momento da escrita, que o pedido continua ABERTO e sem
      // proposta aceite. Se "aceitarProposta" ou "cancelarPedido"
      // ganharem a corrida entretanto, esta condição deixa de bater
      // certo e `count` vem a 0 — sabemos, sem ambiguidade, que
      // perdemos a corrida, em vez de criar uma proposta para um pedido
      // que, no instante em que a proposta é gravada, já está fechado.
      const aindaAberto = await tx.pedido.updateMany({
        where: { id: dados.pedidoId, estado: "ABERTO", propostaAceiteId: null },
        data: { estado: "ABERTO" },
      });

      if (aindaAberto.count === 0) {
        throw new PedidoIndisponivelError();
      }

      const proposta = await tx.proposta.create({
        data: {
          pedidoId: dados.pedidoId,
          agenteId,
          preco: dados.preco,
          prazoDias: dados.prazoDias,
        },
      });

      return { proposta, armadorId: pedido.armadorId, navio: pedido.navio };
    });
  } catch (erro) {
    // Duas propostas do mesmo agente para o mesmo pedido quase em
    // simultâneo: a constraint UNIQUE(pedidoId, agenteId) da base de
    // dados é quem decide, de forma inequívoca, qual passa primeiro.
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new PropostaDuplicadaError();
    }
    throw erro;
  }

  // Notificação é um efeito secundário "best effort": a proposta já
  // está gravada com sucesso nesta linha — uma falha aqui não deve
  // fazer o pedido parecer ter falhado ao agente (ele receberia um erro
  // 500 sobre uma operação que, na verdade, já correu bem).
  try {
    await criarNotificacao({
      userId: resultado.armadorId,
      tipo: "PROPOSTA_RECEBIDA",
      titulo: "Nova proposta recebida",
      mensagem: `Um agente enviou uma proposta para o pedido "${resultado.navio}".`,
      pedidoId: resultado.proposta.pedidoId,
    });
  } catch (erro) {
    console.error("Falha ao criar notificação de proposta recebida:", erro);
  }

  return resultado.proposta;
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
 *
 * Caso limite (corrida de concorrência): se o armador tentar aceitar
 * esta proposta ao mesmo tempo que cancela o pedido (ou aceita outra
 * proposta) — por exemplo em duas abas — a leitura inicial não chega
 * para decidir quem ganha. As DUAS escritas condicionais abaixo
 * (`updateMany` com o estado esperado no `where`) são o mecanismo real:
 * o Postgres serializa escritas concorrentes na mesma linha, e só uma
 * delas vê a condição ainda válida no momento exacto em que escreve.
 * A operação que perde a corrida recebe `count === 0`, e toda a
 * transacção reverte de forma limpa (nada fica "meio feito").
 */
export async function aceitarProposta(
  pedidoId: string,
  propostaId: string,
  armadorId: string
) {
  const resultado = await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: pedidoId },
      select: { armadorId: true, navio: true },
    });

    if (!pedido) {
      throw new NaoEncontradoError();
    }

    if (pedido.armadorId !== armadorId) {
      throw new SemPermissaoError();
    }

    const proposta = await tx.proposta.findUnique({
      where: { id: propostaId },
      select: { id: true, pedidoId: true, preco: true, agenteId: true },
    });

    if (!proposta || proposta.pedidoId !== pedidoId) {
      throw new NaoEncontradoError();
    }

    // Escrita condicional #1 — só aceita se ainda estiver PENDENTE.
    // Protege contra duplo-clique / duas abas a tentar aceitar a MESMA
    // proposta em simultâneo.
    const propostaActualizada = await tx.proposta.updateMany({
      where: { id: propostaId, estado: "PENDENTE" },
      data: { estado: "ACEITE" },
    });

    if (propostaActualizada.count === 0) {
      throw new PropostaJaDecididaError();
    }

    // Escrita condicional #2 — a que resolve a corrida com
    // "cancelarPedido" (ou com aceitar OUTRA proposta do mesmo pedido):
    // só atribui se, neste preciso momento, o pedido ainda estiver
    // ABERTO e sem proposta aceite.
    const pedidoActualizado = await tx.pedido.updateMany({
      where: { id: pedidoId, estado: "ABERTO", propostaAceiteId: null },
      data: { estado: "ATRIBUIDO", propostaAceiteId: propostaId },
    });

    if (pedidoActualizado.count === 0) {
      throw new PedidoFechadoError();
    }

    await tx.proposta.updateMany({
      where: { pedidoId, id: { not: propostaId }, estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    });

    const valorComissao = calcularValorComissao(proposta.preco);

    await tx.comissao.create({
      data: {
        pedidoId,
        valorBase: proposta.preco,
        percentagem: PERCENTAGEM_COMISSAO,
        valorComissao,
      },
    });

    return { navio: pedido.navio, agenteId: proposta.agenteId };
  });

  // Best effort — ver nota em criarProposta.
  try {
    await criarNotificacao({
      userId: resultado.agenteId,
      tipo: "PROPOSTA_ACEITE",
      titulo: "Proposta aceite",
      mensagem: `A sua proposta para o pedido "${resultado.navio}" foi aceite pelo armador.`,
      pedidoId,
    });
  } catch (erro) {
    console.error("Falha ao criar notificação de proposta aceite:", erro);
  }

  return resultado;
}

/**
 * Recusa uma proposta. Só é possível enquanto o pedido está ABERTO e a
 * proposta ainda está PENDENTE. O armador tem de ser dono do pedido.
 *
 * Mesma lógica de escrita condicional que `aceitarProposta`, para o
 * mesmo tipo de corrida (ex.: recusar ao mesmo tempo que o pedido é
 * cancelado, ou que a proposta é aceite noutra aba).
 */
export async function recusarProposta(
  pedidoId: string,
  propostaId: string,
  armadorId: string
) {
  const resultado = await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: pedidoId },
      select: { armadorId: true, navio: true },
    });

    if (!pedido) {
      throw new NaoEncontradoError();
    }

    if (pedido.armadorId !== armadorId) {
      throw new SemPermissaoError();
    }

    const proposta = await tx.proposta.findUnique({
      where: { id: propostaId },
      select: { id: true, pedidoId: true, agenteId: true },
    });

    if (!proposta || proposta.pedidoId !== pedidoId) {
      throw new NaoEncontradoError();
    }

    const propostaActualizada = await tx.proposta.updateMany({
      where: { id: propostaId, estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    });

    if (propostaActualizada.count === 0) {
      throw new PropostaJaDecididaError();
    }

    return { navio: pedido.navio, agenteId: proposta.agenteId };
  });

  try {
    await criarNotificacao({
      userId: resultado.agenteId,
      tipo: "PROPOSTA_RECUSADA",
      titulo: "Proposta recusada",
      mensagem: `A sua proposta para o pedido "${resultado.navio}" foi recusada pelo armador.`,
      pedidoId,
    });
  } catch (erro) {
    console.error("Falha ao criar notificação de proposta recusada:", erro);
  }

  return resultado;
}
