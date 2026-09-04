import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockPropostaFindUnique = vi.fn();
const mockAvaliacaoCreate = vi.fn();
const mockAvaliacaoFindMany = vi.fn();
const mockAvaliacaoFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
    },
    proposta: {
      findUnique: (...args: unknown[]) => mockPropostaFindUnique(...args),
    },
    avaliacao: {
      create: (...args: unknown[]) => mockAvaliacaoCreate(...args),
      findMany: (...args: unknown[]) => mockAvaliacaoFindMany(...args),
      findUnique: (...args: unknown[]) => mockAvaliacaoFindUnique(...args),
    },
  },
}));

const {
  avaliarPedido,
  listarAvaliacoesRecebidas,
  obterAvaliacaoDoPedido,
  SemPermissaoAvaliacaoError,
  PedidoNaoConcluidoError,
  PedidoSemAgenteError,
  AvaliacaoDuplicadaError,
  AvaliacaoNaoEncontradaError,
} = await import("@/servicos/avaliacaoServico");

function pedidoConcluido(extra: Record<string, unknown> = {}) {
  return {
    id: "pedido_1",
    armadorId: "armador_1",
    estado: "CONCLUIDO",
    propostaAceiteId: "proposta_1",
    avaliacao: null,
    ...extra,
  };
}

function resetMocks() {
  mockPedidoFindUnique.mockReset();
  mockPropostaFindUnique.mockReset();
  mockAvaliacaoCreate.mockReset();
  mockAvaliacaoFindMany.mockReset();
  mockAvaliacaoFindUnique.mockReset();
}

describe("avaliarPedido", () => {
  beforeEach(resetMocks);

  it("cria a avaliação associada ao agente da proposta aceite", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoConcluido());
    mockPropostaFindUnique.mockResolvedValue({ agenteId: "agente_1" });
    mockAvaliacaoCreate.mockResolvedValue({ id: "av1" });

    await avaliarPedido("pedido_1", "armador_1", { nota: 5, comentario: "Excelente" });

    expect(mockAvaliacaoCreate).toHaveBeenCalledWith({
      data: {
        pedidoId: "pedido_1",
        agenteId: "agente_1",
        nota: 5,
        comentario: "Excelente",
      },
    });
  });

  it("guarda comentario null quando não é fornecido", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoConcluido());
    mockPropostaFindUnique.mockResolvedValue({ agenteId: "agente_1" });
    mockAvaliacaoCreate.mockResolvedValue({ id: "av1" });

    await avaliarPedido("pedido_1", "armador_1", { nota: 4, comentario: null });

    expect(mockAvaliacaoCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ comentario: null }),
    });
  });

  it("lança AvaliacaoNaoEncontradaError se o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    await expect(
      avaliarPedido("pedido_x", "armador_1", { nota: 5, comentario: null })
    ).rejects.toBeInstanceOf(AvaliacaoNaoEncontradaError);
  });

  it("lança SemPermissaoAvaliacaoError se o pedido não pertence ao armador", async () => {
    mockPedidoFindUnique.mockResolvedValue(
      pedidoConcluido({ armadorId: "outro" })
    );

    await expect(
      avaliarPedido("pedido_1", "armador_1", { nota: 5, comentario: null })
    ).rejects.toBeInstanceOf(SemPermissaoAvaliacaoError);
  });

  it("lança PedidoNaoConcluidoError se o pedido não está concluído", async () => {
    mockPedidoFindUnique.mockResolvedValue(
      pedidoConcluido({ estado: "ATRIBUIDO" })
    );

    await expect(
      avaliarPedido("pedido_1", "armador_1", { nota: 5, comentario: null })
    ).rejects.toBeInstanceOf(PedidoNaoConcluidoError);
  });

  it("lança PedidoSemAgenteError se não há proposta aceite", async () => {
    mockPedidoFindUnique.mockResolvedValue(
      pedidoConcluido({ propostaAceiteId: null })
    );

    await expect(
      avaliarPedido("pedido_1", "armador_1", { nota: 5, comentario: null })
    ).rejects.toBeInstanceOf(PedidoSemAgenteError);
  });

  it("lança PedidoSemAgenteError se a proposta aceite já não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoConcluido());
    mockPropostaFindUnique.mockResolvedValue(null);

    await expect(
      avaliarPedido("pedido_1", "armador_1", { nota: 5, comentario: null })
    ).rejects.toBeInstanceOf(PedidoSemAgenteError);
  });

  it("lança AvaliacaoDuplicadaError se o pedido já foi avaliado", async () => {
    mockPedidoFindUnique.mockResolvedValue(
      pedidoConcluido({ avaliacao: { id: "av0" } })
    );

    await expect(
      avaliarPedido("pedido_1", "armador_1", { nota: 5, comentario: null })
    ).rejects.toBeInstanceOf(AvaliacaoDuplicadaError);
    expect(mockAvaliacaoCreate).not.toHaveBeenCalled();
  });
});

describe("listarAvaliacoesRecebidas", () => {
  beforeEach(resetMocks);

  it("lista as avaliações do agente com o pedido, mais recentes primeiro", async () => {
    mockAvaliacaoFindMany.mockResolvedValue([]);

    await listarAvaliacoesRecebidas("agente_1");

    expect(mockAvaliacaoFindMany).toHaveBeenCalledWith({
      where: { agenteId: "agente_1" },
      orderBy: { criadoEm: "desc" },
      include: { pedido: { select: { id: true, navio: true } } },
    });
  });
});

describe("obterAvaliacaoDoPedido", () => {
  beforeEach(resetMocks);

  it("procura a avaliação do pedido", async () => {
    mockAvaliacaoFindUnique.mockResolvedValue({ id: "av1" });

    const resultado = await obterAvaliacaoDoPedido("pedido_1");

    expect(resultado).toEqual({ id: "av1" });
    expect(mockAvaliacaoFindUnique).toHaveBeenCalledWith({
      where: { pedidoId: "pedido_1" },
    });
  });
});
