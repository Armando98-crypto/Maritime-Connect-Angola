import { prisma } from "@/lib/prisma";
import { listarPedidosAbertosParaAgente } from "./propostaServico";
import { listarComissoesDoAgente } from "./comissaoServico";

export type ResumoArmador = {
  totalPedidos: number;
  porEstado: Record<string, number>;
  propostasAguardaDecisao: number;
};

export type ResumoAgente = {
  pedidosAbertos: number;
  propostasPorEstado: Record<string, number>;
  comissoesPendentes: number;
  totalComissaoPendente: number;
  mediaAvaliacoes: number | null;
};

/**
 * Resumo para o quadro de bordo do armador: quantos pedidos tem, em que
 * estados, e quantas propostas estão por decidir (para lhe chamar a
 * atenção para onde agir).
 */
export async function obterResumoArmador(armadorId: string): Promise<ResumoArmador> {
  const pedidos = await prisma.pedido.findMany({
    where: { armadorId },
    select: { estado: true },
  });

  const totalPedidos = pedidos.length;
  const porEstado: Record<string, number> = {};

  for (const p of pedidos) {
    porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
  }

  const pedidosAbertos = await prisma.pedido.findMany({
    where: {
      armadorId,
      estado: "ABERTO",
      propostas: { some: { estado: "PENDENTE" } },
    },
    select: { id: true },
  });

  return {
    totalPedidos,
    porEstado,
    propostasAguardaDecisao: pedidosAbertos.length,
  };
}

/**
 * Resumo para o quadro de bordo do agente: quantos pedidos há abertos
 * no porto, o estado das suas propostas, as comissões em dívida e a
 * avaliação média recebida.
 */
export async function obterResumoAgente(agenteId: string): Promise<ResumoAgente> {
  const [pedidosAbertos, minhasPropostas, comissoes, avaliacoes] = await Promise.all([
    listarPedidosAbertosParaAgente(),
    prisma.proposta.findMany({
      where: { agenteId },
      select: { estado: true },
    }),
    listarComissoesDoAgente(agenteId),
    prisma.avaliacao.aggregate({
      where: { agenteId },
      _avg: { nota: true },
      _count: true,
    }),
  ]);

  const propostasPorEstado: Record<string, number> = {};
  for (const p of minhasPropostas) {
    propostasPorEstado[p.estado] = (propostasPorEstado[p.estado] ?? 0) + 1;
  }

  const comissoesPendentes = comissoes.filter((c) => c.estado === "PENDENTE");
  const totalComissaoPendente = comissoesPendentes.reduce(
    (soma, c) => soma + Number(c.valorComissao),
    0
  );

  return {
    pedidosAbertos: pedidosAbertos.length,
    propostasPorEstado,
    comissoesPendentes: comissoesPendentes.length,
    totalComissaoPendente,
    mediaAvaliacoes:
      avaliacoes._count === 0 ? null : Math.round((avaliacoes._avg.nota ?? 0) * 10) / 10,
  };
}