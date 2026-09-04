import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
    },
  },
}));

const {
  calcularValorComissao,
  PERCENTAGEM_COMISSAO,
  listarComissoesDoAgente,
} = await import("@/servicos/comissaoServico");

function resetMocks() {
  mockPedidoFindMany.mockReset();
}

describe("calcularValorComissao", () => {
  it("aplica a percentagem fixa ao valor base", () => {
    expect(PERCENTAGEM_COMISSAO).toBe(10);
    expect(calcularValorComissao(100_000)).toBe(10_000);
    expect(calcularValorComissao(50_000)).toBe(5_000);
    expect(calcularValorComissao(12_345.67)).toBe(1234.57);
  });
});

describe("listarComissoesDoAgente", () => {
  beforeEach(resetMocks);

  it("devolve as comissões dos pedidos onde o agente foi o escolhido", async () => {
    mockPedidoFindMany.mockResolvedValue([
      {
        id: "pedido_1",
        navio: "Libra",
        comissao: {
          id: "com_1",
          pedidoId: "pedido_1",
          valorComissao: 1000,
          percentagem: 10,
          estado: "PENDENTE",
        },
      },
      {
        id: "pedido_2",
        navio: "Orion",
        comissao: null,
      },
    ]);

    const resultado = await listarComissoesDoAgente("agente_1");

    expect(mockPedidoFindMany).toHaveBeenCalledWith({
      where: { propostaAceite: { agenteId: "agente_1" } },
      orderBy: { criadoEm: "desc" },
      select: { id: true, navio: true, comissao: true },
    });
    // O pedido sem comissão não entra na lista; o campo pedidoId é juntado.
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      pedidoId: "pedido_1",
      navio: "Libra",
      id: "com_1",
      estado: "PENDENTE",
    });
  });

  it("devolve lista vazia se o agente não tem pedidos", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await expect(listarComissoesDoAgente("agente_1")).resolves.toEqual([]);
  });
});