import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockNotificacaoCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
    },
    notificacao: {
      create: (...args: unknown[]) => mockNotificacaoCreate(...args),
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
  armadorId: "armador_1",
  navio: "Libra",
};

const propostaPendente = {
  id: "proposta_1",
  pedidoId: "pedido_1",
  preco: 100_000,
  agenteId: "agente_1",
};

/** Constrói um `tx` mockado para os testes de aceitarProposta. */
function txPara(opcoes: {
  pedido?: unknown;
  proposta?: unknown;
  propostaUpdateCount?: number;
  pedidoUpdateCount?: number;
}) {
  const {
    pedido = pedidoDoArmador,
    proposta = propostaPendente,
    propostaUpdateCount = 1,
    pedidoUpdateCount = 1,
  } = opcoes;

  return {
    pedido: {
      findUnique: vi.fn().mockResolvedValue(pedido),
      updateMany: vi.fn().mockResolvedValue({ count: pedidoUpdateCount }),
    },
    proposta: {
      findUnique: vi.fn().mockResolvedValue(proposta),
      updateMany: vi.fn().mockResolvedValue({ count: propostaUpdateCount }),
    },
    comissao: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

function configurarTransacao(tx: Record<string, unknown>) {
  mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback(tx)
  );
}

describe("aceitarProposta", () => {
  beforeEach(() => {
    mockPedidoFindUnique.mockReset();
    mockTransaction.mockReset();
    mockNotificacaoCreate.mockReset().mockResolvedValue({});
  });

  it("aceita a proposta, recusa as restantes pendentes, atribui o pedido e gera a comissão em Decimal, dentro de UMA transacção interactive", async () => {
    const tx = txPara({});
    configurarTransacao(tx);

    await aceitarProposta("pedido_1", "proposta_1", "armador_1");

    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // Escrita condicional #1: só aceita se ainda PENDENTE.
    expect(tx.proposta.updateMany).toHaveBeenCalledWith({
      where: { id: "proposta_1", estado: "PENDENTE" },
      data: { estado: "ACEITE" },
    });
    // restantes pendentes -> RECUSADA
    expect(tx.proposta.updateMany).toHaveBeenCalledWith({
      where: { pedidoId: "pedido_1", id: { not: "proposta_1" }, estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    });
    // Escrita condicional #2: só atribui se ainda ABERTO e sem proposta
    // aceite — é esta que resolve a corrida com cancelarPedido.
    expect(tx.pedido.updateMany).toHaveBeenCalledWith({
      where: { id: "pedido_1", estado: "ABERTO", propostaAceiteId: null },
      data: { estado: "ATRIBUIDO", propostaAceiteId: "proposta_1" },
    });
    // comissão gerada em Decimal, nunca em float: 10% de 100000 = 10000
    const chamada = (tx.comissao.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(chamada.data.pedidoId).toBe("pedido_1");
    expect(chamada.data.percentagem).toBe(10);
    expect(chamada.data.valorComissao.toString()).toBe("10000");
    expect(chamada.data.valorComissao.constructor.name).toBe("Decimal");
  });

  it("caso limite (corrida): o pedido é cancelado entre a leitura e a escrita — a escrita condicional apanha isso e lança PedidoFechadoError, sem deixar o pedido corrompido", async () => {
    // A proposta ainda consegue passar a ACEITE (a corrida está no
    // pedido, não na proposta em si)...
    const tx = txPara({ propostaUpdateCount: 1, pedidoUpdateCount: 0 });
    configurarTransacao(tx);

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PedidoFechadoError);

    // ...mas a comissão nunca chega a ser criada, porque o `throw`
    // dentro da transacção interactive faz o Prisma reverter tudo,
    // incluindo a proposta que tinha acabado de passar a ACEITE.
    expect(tx.comissao.create).not.toHaveBeenCalled();
  });

  it("caso limite (corrida): duas tentativas de aceitar a MESMA proposta — a segunda encontra-a já não-PENDENTE", async () => {
    const tx = txPara({ propostaUpdateCount: 0 });
    configurarTransacao(tx);

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PropostaJaDecididaError);

    expect(tx.pedido.updateMany).not.toHaveBeenCalled();
    expect(tx.comissao.create).not.toHaveBeenCalled();
  });

  it("lança NaoEncontradoError se o pedido não existe", async () => {
    configurarTransacao(txPara({ pedido: null }));

    await expect(
      aceitarProposta("pedido_x", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(NaoEncontradoError);
  });

  it("lança SemPermissaoError se o pedido não pertence ao armador", async () => {
    configurarTransacao(txPara({ pedido: { ...pedidoDoArmador, armadorId: "outro" } }));

    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(SemPermissaoError);
  });

  it("lança NaoEncontradoError se a proposta não existe ou não é do pedido", async () => {
    configurarTransacao(txPara({ proposta: null }));
    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(NaoEncontradoError);

    configurarTransacao(
      txPara({ proposta: { ...propostaPendente, pedidoId: "outro_pedido" } })
    );
    await expect(
      aceitarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(NaoEncontradoError);
  });
});

describe("recusarProposta", () => {
  beforeEach(() => {
    mockTransaction.mockReset();
    mockNotificacaoCreate.mockReset().mockResolvedValue({});
  });

  it("recusa a proposta pendente dentro de uma transacção condicional", async () => {
    const tx = txPara({});
    configurarTransacao(tx);

    await recusarProposta("pedido_1", "proposta_1", "armador_1");

    expect(tx.proposta.updateMany).toHaveBeenCalledWith({
      where: { id: "proposta_1", estado: "PENDENTE" },
      data: { estado: "RECUSADA" },
    });
  });

  it("caso limite (corrida): a proposta já foi decidida entretanto (ex.: aceite noutra aba) — lança PropostaJaDecididaError", async () => {
    configurarTransacao(txPara({ propostaUpdateCount: 0 }));

    await expect(
      recusarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(PropostaJaDecididaError);
  });

  it("lança SemPermissaoError se o pedido não pertence ao armador", async () => {
    configurarTransacao(txPara({ pedido: { ...pedidoDoArmador, armadorId: "outro" } }));

    await expect(
      recusarProposta("pedido_1", "proposta_1", "armador_1")
    ).rejects.toBeInstanceOf(SemPermissaoError);
  });
});

describe("obterPedidoComPropostas", () => {
  beforeEach(() => {
    mockPedidoFindUnique.mockReset();
  });

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
    mockPedidoFindUnique.mockResolvedValue({ ...pedidoCompleto, armadorId: "outro" });

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
