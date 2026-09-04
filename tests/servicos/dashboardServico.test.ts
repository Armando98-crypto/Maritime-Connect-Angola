import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindMany = vi.fn();
const mockPropostaFindMany = vi.fn();
const mockAvaliacaoAggregate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
    },
    proposta: {
      findMany: (...args: unknown[]) => mockPropostaFindMany(...args),
    },
    avaliacao: {
      aggregate: (...args: unknown[]) => mockAvaliacaoAggregate(...args),
    },
  },
}));

const { obterResumoArmador, obterResumoAgente } = await import(
  "@/servicos/dashboardServico"
);

function resetMocks() {
  mockPedidoFindMany.mockReset();
  mockPropostaFindMany.mockReset();
  mockAvaliacaoAggregate.mockReset();
}

describe("obterResumoArmador", () => {
  beforeEach(resetMocks);

  it("conta pedidos por estado e detecta propostas pendentes de decisão", async () => {
    mockPedidoFindMany
      .mockResolvedValueOnce([
        { estado: "ABERTO" },
        { estado: "ABERTO" },
        { estado: "ATRIBUIDO" },
        { estado: "CONCLUIDO" },
      ])
      .mockResolvedValueOnce([{ id: "pedido_1" }]);

    const resumo = await obterResumoArmador("armador_1");

    expect(resumo.totalPedidos).toBe(4);
    expect(resumo.porEstado).toEqual({
      ABERTO: 2,
      ATRIBUIDO: 1,
      CONCLUIDO: 1,
    });
    expect(resumo.propostasAguardaDecisao).toBe(1);
  });

  it("devolve zero quando o armador não tem pedidos", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    const resumo = await obterResumoArmador("armador_1");

    expect(resumo.totalPedidos).toBe(0);
    expect(resumo.porEstado).toEqual({});
    expect(resumo.propostasAguardaDecisao).toBe(0);
  });
});

describe("obterResumoAgente", () => {
  beforeEach(resetMocks);

  it("devolve o resumo completo: pedidos abertos, propostas, comissões e avaliação", async () => {
    mockPedidoFindMany
      // listarPedidosAbertosParaAgente
      .mockResolvedValueOnce([{ id: "p1" }, { id: "p2" }])
      // listarComissoesDoAgente → prisma.pedido.findMany
      .mockResolvedValueOnce([
        {
          id: "p1",
          navio: "Libra",
          comissao: {
            id: "c1",
            pedidoId: "p1",
            estado: "PENDENTE",
            valorComissao: 5000,
            percentagem: 10,
            valorBase: 50000,
          },
        },
      ]);
    // prisma.proposta.findMany (direct)
    mockPropostaFindMany.mockResolvedValueOnce([
      { estado: "PENDENTE" },
      { estado: "PENDENTE" },
      { estado: "ACEITE" },
    ]);
    mockAvaliacaoAggregate.mockResolvedValue({
      _avg: { nota: 4.3 },
      _count: 5,
    });

    const resumo = await obterResumoAgente("agente_1");

    expect(resumo.pedidosAbertos).toBe(2);
    expect(resumo.propostasPorEstado).toEqual({
      PENDENTE: 2,
      ACEITE: 1,
    });
    expect(resumo.comissoesPendentes).toBe(1);
    expect(resumo.totalComissaoPendente).toBe(5000);
    expect(resumo.mediaAvaliacoes).toBe(4.3);
  });

  it("devolve zeros e média null quando o agente não tem actividad", async () => {
    mockPedidoFindMany.mockResolvedValue([]);
    mockPropostaFindMany.mockResolvedValue([]);
    mockAvaliacaoAggregate.mockResolvedValue({
      _avg: { nota: null },
      _count: 0,
    });

    const resumo = await obterResumoAgente("agente_1");

    expect(resumo.pedidosAbertos).toBe(0);
    expect(resumo.propostasPorEstado).toEqual({});
    expect(resumo.comissoesPendentes).toBe(0);
    expect(resumo.totalComissaoPendente).toBe(0);
    expect(resumo.mediaAvaliacoes).toBeNull();
  });
});