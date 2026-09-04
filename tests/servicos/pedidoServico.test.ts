import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoCreate = vi.fn();
const mockPedidoFindMany = vi.fn();
const mockPedidoFindUnique = vi.fn();
const mockPedidoUpdate = vi.fn();
const mockPropostaFindMany = vi.fn();
const mockPropostaUpdateMany = vi.fn();
const mockNotificacaoCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      create: (...args: unknown[]) => mockPedidoCreate(...args),
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      update: (...args: unknown[]) => mockPedidoUpdate(...args),
    },
    proposta: {
      findMany: (...args: unknown[]) => mockPropostaFindMany(...args),
      updateMany: (...args: unknown[]) => mockPropostaUpdateMany(...args),
    },
    notificacao: {
      create: (...args: unknown[]) => mockNotificacaoCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const {
  criarPedido,
  listarPedidosDoArmador,
  cancelarPedido,
  PedidoNaoEncontradoError,
  SemPermissaoPedidoError,
  PedidoNaoCancelavelError,
} = await import("@/servicos/pedidoServico");

function resetMocks() {
  mockPedidoCreate.mockReset();
  mockPedidoFindMany.mockReset();
  mockPedidoFindUnique.mockReset();
  mockPedidoUpdate.mockReset();
  mockPropostaFindMany.mockReset();
  mockPropostaUpdateMany.mockReset();
  mockNotificacaoCreate.mockReset();
  mockTransaction.mockReset();
}

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

  it("nunca define o estado explicitamente", async () => {
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
  beforeEach(resetMocks);

  it("filtra só pelos pedidos do armador indicado", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await listarPedidosDoArmador("armador_1");

    expect(mockPedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { armadorId: "armador_1" },
      })
    );
  });

  it("filtra por estado quando fornecido", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await listarPedidosDoArmador("armador_1", "ABERTO");

    expect(mockPedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { armadorId: "armador_1", estado: "ABERTO" },
      })
    );
  });

  it("ignora estados inválidos", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await listarPedidosDoArmador("armador_1", "INVALIDO");

    expect(mockPedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { armadorId: "armador_1" },
      })
    );
  });
});

describe("cancelarPedido", () => {
  beforeEach(resetMocks);

  it("cancela um pedido ABERTO, recusa propostas pendentes e notifica agentes", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      id: "pedido_1",
      armadorId: "armador_1",
      estado: "ABERTO",
      navio: "Libra",
    });
    mockPropostaFindMany.mockResolvedValue([
      { id: "p1", agenteId: "agente_1" },
      { id: "p2", agenteId: "agente_2" },
    ]);
    mockTransaction.mockResolvedValue([{}, {}]);
    mockNotificacaoCreate.mockResolvedValue({});

    await cancelarPedido("pedido_1", "armador_1");

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockPedidoUpdate).toHaveBeenCalledWith({
      where: { id: "pedido_1" },
      data: { estado: "CANCELADO" },
    });
    expect(mockPropostaUpdateMany).toHaveBeenCalledWith({
      where: { pedidoId: "pedido_1", estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    });
    expect(mockNotificacaoCreate).toHaveBeenCalledTimes(2);
  });

  it("lança PedidoNaoEncontradoError se o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    await expect(cancelarPedido("pedido_x", "armador_1")).rejects.toBeInstanceOf(
      PedidoNaoEncontradoError
    );
  });

  it("lança SemPermissaoPedidoError se o pedido não pertence ao armador", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      id: "pedido_1",
      armadorId: "outro",
      estado: "ABERTO",
      navio: "Libra",
    });

    await expect(cancelarPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
      SemPermissaoPedidoError
    );
  });

  it("lança PedidoNaoCancelavelError se o pedido não está ABERTO", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      id: "pedido_1",
      armadorId: "armador_1",
      estado: "ATRIBUIDO",
      navio: "Libra",
    });

    await expect(cancelarPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
      PedidoNaoCancelavelError
    );
  });
});
