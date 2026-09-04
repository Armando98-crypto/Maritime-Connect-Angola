import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoCreate = vi.fn();
const mockPedidoFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      create: (...args: unknown[]) => mockPedidoCreate(...args),
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
    },
  },
}));

const { criarPedido, listarPedidosDoArmador } = await import(
  "@/servicos/pedidoServico"
);

describe("criarPedido", () => {
  beforeEach(() => {
    mockPedidoCreate.mockReset();
  });

  it("cria o pedido associado ao armador, com a data convertida para Date", async () => {
    mockPedidoCreate.mockResolvedValue({ id: "pedido_1", estado: "ABERTO" });

    await criarPedido("armador_1", {
      navio: "MV Namibe Star",
      dataPrevistaChegada: "2026-12-01",
      detalhes: "Carga geral, necessita de reboque para atracação.",
    });

    expect(mockPedidoCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        armadorId: "armador_1",
        navio: "MV Namibe Star",
        detalhes: "Carga geral, necessita de reboque para atracação.",
        dataPrevistaChegada: expect.any(Date),
      }),
    });
  });

  it("nunca define o estado explicitamente — deixa o valor por omissão (ABERTO) do schema decidir", async () => {
    mockPedidoCreate.mockResolvedValue({ id: "pedido_2" });

    await criarPedido("armador_1", {
      navio: "MV Teste",
      dataPrevistaChegada: "2026-12-01",
      detalhes: "Detalhes suficientemente longos para passar a validação.",
    });

    const argumentos = mockPedidoCreate.mock.calls[0][0];
    expect(argumentos.data).not.toHaveProperty("estado");
    expect(argumentos.data).not.toHaveProperty("propostaAceiteId");
  });
});

describe("listarPedidosDoArmador", () => {
  beforeEach(() => {
    mockPedidoFindMany.mockReset();
  });

  it("filtra só pelos pedidos do armador indicado, mais recentes primeiro", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await listarPedidosDoArmador("armador_1");

    expect(mockPedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { armadorId: "armador_1" },
        orderBy: { criadoEm: "desc" },
      })
    );
  });

  it("inclui a contagem de propostas de cada pedido", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await listarPedidosDoArmador("armador_1");

    expect(mockPedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { _count: { select: { propostas: true } } },
      })
    );
  });
});
