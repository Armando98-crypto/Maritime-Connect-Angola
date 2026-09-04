import { prisma } from "@/lib/prisma";

/**
 * Percentagem fixa (em %) que a plataforma cobra ao agente sobre o
 * valor da proposta aceite. Definida aqui, centralizada, para ser fácil
 * de ajustar sem tocar em várias partes do código.
 */
export const PERCENTAGEM_COMISSAO = 10;

/**
 * O agente tentou aceder a uma comissão que não lhe pertence.
 */
export class SemPermissaoComissaoError extends Error {
  constructor() {
    super("Não tem permissão para aceder a esta comissão.");
    this.name = "SemPermissaoComissaoError";
  }
}

/**
 * A comissão (ou o pedido associado) não existe.
 */
export class ComissaoNaoEncontradaError extends Error {
  constructor() {
    super("A comissão não foi encontrada.");
    this.name = "ComissaoNaoEncontradaError";
  }
}

/**
 * A comissão já foi marcada como paga — não pode ser alterada.
 */
export class ComissaoJaPagaError extends Error {
  constructor() {
    super("Esta comissão já foi paga.");
    this.name = "ComissaoJaPagaError";
  }
}

/**
 * Calcula o valor da comissão a partir do valor base e da percentagem
 * fixa da plataforma. Arredonda a 2 casas decimais.
 */
export function calcularValorComissao(valorBase: number): number {
  const valor = (valorBase * PERCENTAGEM_COMISSAO) / 100;
  return Math.round(valor * 100) / 100;
}

/**
 * Resolve o agente dono de uma comissão a partir do pedido: o agente é
 * o da proposta aceite. Devolve o id do agente ou `null` se não houver.
 */
async function obterAgenteDaComissao(pedidoId: string): Promise<string | null> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      propostaAceite: {
        select: { agenteId: true },
      },
    },
  });
  return pedido?.propostaAceite?.agenteId ?? null;
}

/**
 * Lista as comissões de um agente (dos pedidos onde foi o escolhido),
 * mais recentes primeiro, com o navio do pedido. O agente usa isto para
 * ver quanto deve (PENDENTE) e o histórico do que já pagou (PAGA).
 */
export async function listarComissoesDoAgente(agenteId: string) {
  const pedidos = await prisma.pedido.findMany({
    where: { propostaAceite: { agenteId } },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      navio: true,
      comissao: true,
    },
  });

  return pedidos
    .filter((p) => p.comissao)
    .map((p) => ({ ...p.comissao!, navio: p.navio }));
}

/**
 * Marca a comissão de um pedido como paga. Só o agente dono da comissão
 * (o da proposta aceite do pedido) o pode fazer, e só se ainda estiver
 * PENDENTE.
 */
export async function marcarComissaoPaga(
  comissaoId: string,
  agenteId: string
) {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: {
      id: true,
      pedidoId: true,
      estado: true,
    },
  });

  if (!comissao) {
    throw new ComissaoNaoEncontradaError();
  }

  const dono = await obterAgenteDaComissao(comissao.pedidoId);
  if (dono !== agenteId) {
    throw new SemPermissaoComissaoError();
  }

  if (comissao.estado !== "PENDENTE") {
    throw new ComissaoJaPagaError();
  }

  return prisma.comissao.update({
    where: { id: comissao.id },
    data: { estado: "PAGA" },
  });
}
