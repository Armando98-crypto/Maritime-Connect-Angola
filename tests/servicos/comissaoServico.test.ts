import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockPedidoFindMany = vi.fn();
const mockComissaoFindUnique = vi.fn();
const mockComissaoUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
    },
    comissao: {
      findUnique: (...args: unknown[]) => mockComissaoFindUnique(...args),
      update: (...args: unknown[]) => mockComissaoUpdate(...args),
    },
  },
}));

const {
  calcularValorComissao,
  PERCENTAGEM_COMISSAO,
  listarComissoesDoAgente,
  marcarComissaoPaga,
  SemPermissaoComissaoError,
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
} = await import("@/servicos/comissaoServico");

function resetMocks() {
  mockPedidoFindUnique.mockReset();
  mockPedidoFindMany.mockReset();
  mockComissaoFindUnique.mockReset();
  mockComissaoUpdate.mockReset();
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

describe("marcarComissaoPaga", () => {
  beforeEach(resetMocks);

  it("marca como paga uma comissão PENDENTE do agente dono", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "agente_1" },
    });
    mockComissaoUpdate.mockResolvedValue({});

    await marcarComissaoPaga("com_1", "agente_1");

    expect(mockComissaoUpdate).toHaveBeenCalledWith({
      where: { id: "com_1" },
      data: { estado: "PAGA" },
    });
  });

  it("lança ComissaoNaoEncontradaError se a comissão não existe", async () => {
    mockComissaoFindUnique.mockResolvedValue(null);

    await expect(marcarComissaoPaga("com_x", "agente_1")).rejects.toBeInstanceOf(
      ComissaoNaoEncontradaError
    );
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("lança SemPermissaoComissaoError se o agente não é o dono", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "outro_agente" },
    });

    await expect(marcarComissaoPaga("com_1", "agente_1")).rejects.toBeInstanceOf(
      SemPermissaoComissaoError
    );
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("lança ComissaoJaPagaError se a comissão já está paga", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PAGA",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "agente_1" },
    });

    await expect(marcarComissaoPaga("com_1", "agente_1")).rejects.toBeInstanceOf(
      ComissaoJaPagaError
    );
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });
});
