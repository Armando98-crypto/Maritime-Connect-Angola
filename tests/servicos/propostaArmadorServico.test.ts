import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockPedidoFindMany = vi.fn();
const mockPropostaFindUnique = vi.fn();
const mockPropostaFindMany = vi.fn();
const mockPropostaUpdate = vi.fn();
const mockPropostaUpdateMany = vi.fn();
const mockPedidoUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
      update: (...args: unknown[]) => mockPedidoUpdate(...args),
    },
    proposta: {
      findUnique: (...args: unknown[]) => mockPropostaFindUnique(...args),
      findMany: (...args: unknown[]) => mockPropostaFindMany(...args),
      update: (...args: unknown[]) => mockPropostaUpdate(...args),
      updateMany: (...args: unknown[]) => mockPropostaUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const {
  aceitarProposta,
  recusarProposta,
  obterPedidoComPropostas,
  NaoEncontradoError,
  SemPermissaoError,
  PedidoFechadoError,
  PropostaJaDecididaError,
} = await import("@/servicos/propostaServico");

const pedidoDoArmador = {
  id: "pedido_1",
  armadorId: "armador_1",
  estado: "ABERTO",
  propostaAceiteId: null,
};

function resetMocks() {
  mockPedidoFindUnique.mockReset();
  mockPropostaFindUnique.mockReset();
  mockPropostaUpdate.mockReset();
  mockPropostaUpdateMany.mockReset();
  mockPedidoUpdate.mockReset();
  mockTransaction.mockReset();
  mockPedidoFindMany.mockReset();
  mockPropostaFindMany.mockReset();
}

describe("aceitarProposta", () => {
  beforeEach(resetMocks);

  it("aceita a proposta, recusa as restantes pendentes e atribui o pedido numa transacção", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoDoArmador);
    mockPropostaFindUnique.mockResolvedValue({
      id: "proposta_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    // Os passos da transacção são promises Prisma; mockamo-los (o que
    // importa são os argumentos passados a cada passo).
    mockPropostaUpdate.mockResolvedValue({});
    mockPropostaUpdateMany.mockResolvedValue({});
    mockPedidoUpdate.mockResolvedValue({});
    mockTransaction.mockResolvedValue([{}, {}, {}]);

    await aceitarProposta("pedido_1", "proposta_1", "armador_1");

    // Os três passos são envolvidos numa transacção.
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.mock.calls[0][0]).toHaveLength(3);

    // proposta escolhida -> ACEITE
    expect(mockPropostaUpdate).toHaveBeenCalledWith({
      where: { id: "proposta_1" },
      data: { estado: "ACEITE" },
    });
    // restantes pendentes -> RECUSADA
    expect(mockPropostaUpdateMany).toHaveBeenCalledWith({
      where: { pedidoId: "pedido_1", id: { not: "proposta_1" }, estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    });
    // pedido -> ATRIBUIDO + ligado à proposta aceite
    expect(mockPedidoUpdate).toHaveBeenCalledWith({
      where: { id: "pedido_1" },
      data: { estado: "ATRIBUIDO", propostaAceiteId: "proposta_1" },
    });
  });

  it("lança NaoEncontradoError se o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    await expect(
      aceitarProposta("pedido_x", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(NaoEncontradoError);
  });

  it("lança SemPermissaoError se o pedido não pertence ao armador", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoDoArmador,
      armadorId: "outro_armador",
    });

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(SemPermissaoError);
  });

  it("lança PedidoFechadoError se o pedido já está atribuído", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoDoArmador,
      estado: "ATRIBUIDO",
    });

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PedidoFechadoError);
  });

  it("lança PedidoFechadoError se o pedido já tem proposta aceite", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoDoArmador,
      propostaAceiteId: "proposta_x",
    });

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PedidoFechadoError);
  });

  it("lança NaoEncontradoError se a proposta não existe ou não é do pedido", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoDoArmador);
    mockPropostaFindUnique.mockResolvedValue(null);

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(NaoEncontradoError);

    mockPropostaFindUnique.mockResolvedValue({
      id: "proposta_1",
      pedidoId: "outro_pedido",
      estado: "PENDENTE",
    });
    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(NaoEncontradoError);
  });

  it("lança PropostaJaDecididaError se a proposta já não está pendente", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoDoArmador);
    mockPropostaFindUnique.mockResolvedValue({
      id: "proposta_1",
      pedidoId: "pedido_1",
      estado: "ACEITE",
    });

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PropostaJaDecididaError);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe("recusarProposta", () => {
  beforeEach(resetMocks);

  it("recusa a proposta pendente", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoDoArmador);
    mockPropostaFindUnique.mockResolvedValue({
      id: "proposta_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPropostaUpdate.mockResolvedValue({});

    await recusarProposta("pedido_1", "proposta_1", "armador_1");

    expect(mockPropostaUpdate).toHaveBeenCalledWith({
      where: { id: "proposta_1" },
      data: { estado: "RECUSADA" },
    });
  });

  it("não mexe no pedido (não usa transacção tripla)", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoDoArmador);
    mockPropostaFindUnique.mockResolvedValue({
      id: "proposta_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPropostaUpdate.mockResolvedValue({});

    await recusarProposta("pedido_1", "proposta_1", "armador_1");

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockPedidoUpdate).not.toHaveBeenCalled();
  });

  it("lança PedidoFechadoError se o pedido já não está aberto", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoDoArmador,
      estado: "CONCLUIDO",
    });

    await expect(
      recusarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PedidoFechadoError);
  });
});

describe("obterPedidoComPropostas", () => {
  beforeEach(resetMocks);

  const pedidoCompleto = {
    id: "pedido_1",
    armadorId: "armador_1",
    navio: "MV Namibe",
    propostaAceiteId: null,
    propostas: [],
  };

  it("devolve null se o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    const resultado = await obterPedidoComPropostas("pedido_x", "armador_1");
    expect(resultado).toBeNull();
  });

  it("lança SemPermissaoError se o pedido não pertence ao armador", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoCompleto,
      armadorId: "outro",
    });

    await expect(
      obterPedidoComPropostas("pedido_1", "armador_1")
    ).rejects.toBeInstanceOf(SemPermissaoError);
  });

  it("devolve o pedido com propostas ordenadas por data", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoCompleto);

    await obterPedidoComPropostas("pedido_1", "armador_1");

    expect(mockPedidoFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pedido_1" },
        include: expect.objectContaining({
          propostaAceite: expect.any(Object),
          propostas: expect.objectContaining({ orderBy: { criadoEm: "asc" } }),
        }),
      })
    );
  });
});
