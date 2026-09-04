import { prisma } from "@/lib/prisma";

/**
 * Percentagem fixa (em %) que a plataforma cobra ao agente sobre o
 * valor da proposta aceite. Definida aqui, centralizada, para ser fácil
 * de ajustar sem tocar em várias partes do código.
 */
export const PERCENTAGEM_COMISSAO = 10;

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
 * Lista as comissões de um agente (dos pedidos onde foi o escolhido),
 * mais recentes primeiro, com o navio do pedido. O agente usa isto para
 * ver quanto deve (PENDENTE) e o histórico do que já está pago (PAGA).
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
