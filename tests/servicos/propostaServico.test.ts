import { describe, it, expect, vi, beforeEach } from "vitest";

class PrismaClientKnownRequestErrorSimulado extends Error {
  code: string;
  meta?: Record<string, unknown>;
  constructor(message: string, opts: { code: string; meta?: Record<string, unknown> }) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
    this.code = opts.code;
    this.meta = opts.meta;
  }
}

vi.mock("@prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: PrismaClientKnownRequestErrorSimulado,
  },
}));

const mockPerfilAgenteFindUnique = vi.fn();
const mockPedidoFindMany = vi.fn();
const mockPropostaFindMany = vi.fn();
const mockPedidoFindFirst = vi.fn();
const mockNotificacaoCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    perfilAgente: {
      findUnique: (...args: unknown[]) => mockPerfilAgenteFindUnique(...args),
    },
    pedido: {
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
      findFirst: (...args: unknown[]) => mockPedidoFindFirst(...args),
    },
    proposta: {
      findMany: (...args: unknown[]) => mockPropostaFindMany(...args),
    },
    notificacao: {
      create: (...args: unknown[]) => mockNotificacaoCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const {
  criarProposta,
  listarPedidosAbertosParaAgente,
  listarPropostasDoAgente,
  obterPedidoAbertoParaAgente,
  PedidoIndisponivelError,
  ProprioPedidoError,
  PropostaDuplicadaError,
  LicencaNaoVerificadaError,
  AgenteSemPerfilError,
} = await import("@/servicos/propostaServico");

const pedidoAberto = {
  id: "pedido_1",
  armadorId: "armador_1",
  estado: "ABERTO",
  propostaAceiteId: null,
  navio: "Libra",
};

function dadosValidos() {
  return { pedidoId: "pedido_1", preco: 250_000, prazoDias: 5 };
}

/**
 * Simula uma transacção Prisma interactive: corre o callback com um
 * `tx` mockado, cujo comportamento cada teste configura conforme o
 * cenário (pedido ainda aberto, já fechado por outra operação, etc.).
 */
function configurarTransacao(tx: Record<string, unknown>) {
  mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback(tx)
  );
}

describe("criarProposta", () => {
  beforeEach(() => {
    mockPerfilAgenteFindUnique.mockReset();
    mockNotificacaoCreate.mockReset();
    mockTransaction.mockReset();
  });

  it("lança AgenteSemPerfilError se o agente não tiver PerfilAgente", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue(null);

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      AgenteSemPerfilError
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("lança LicencaNaoVerificadaError se a licença do agente ainda não foi verificada — bloqueado com explicação, nunca em silêncio", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: false });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      LicencaNaoVerificadaError
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("cria a proposta e notifica o armador quando o pedido está aberto e sem proposta aceite", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    mockNotificacaoCreate.mockResolvedValue({});

    const txPedidoFindUnique = vi.fn().mockResolvedValue(pedidoAberto);
    const txPedidoUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const txPropostaCreate = vi
      .fn()
      .mockResolvedValue({ id: "proposta_1", pedidoId: "pedido_1" });

    configurarTransacao({
      pedido: { findUnique: txPedidoFindUnique, updateMany: txPedidoUpdateMany },
      proposta: { create: txPropostaCreate },
    });

    await criarProposta("agente_1", dadosValidos());

    expect(txPropostaCreate).toHaveBeenCalledWith({
      data: { pedidoId: "pedido_1", agenteId: "agente_1", preco: 250_000, prazoDias: 5 },
    });
    expect(mockNotificacaoCreate).toHaveBeenCalledWith({
      data: {
        userId: "armador_1",
        tipo: "PROPOSTA_RECEBIDA",
        titulo: "Nova proposta recebida",
        mensagem: 'Um agente enviou uma proposta para o pedido "Libra".',
        pedidoId: "pedido_1",
      },
    });
  });

  it("não falha ao criar a proposta se a notificação falhar (efeito secundário best-effort)", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    mockNotificacaoCreate.mockRejectedValue(new Error("falha transitória de rede"));

    configurarTransacao({
      pedido: {
        findUnique: vi.fn().mockResolvedValue(pedidoAberto),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      proposta: {
        create: vi.fn().mockResolvedValue({ id: "proposta_1", pedidoId: "pedido_1" }),
      },
    });

    // Não deve rejeitar — a proposta já está gravada com sucesso; a
    // falha da notificação é só registada em log.
    await expect(criarProposta("agente_1", dadosValidos())).resolves.toMatchObject({
      id: "proposta_1",
    });
  });

  it("lança PedidoIndisponivelError quando o pedido não existe", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    configurarTransacao({
      pedido: { findUnique: vi.fn().mockResolvedValue(null), updateMany: vi.fn() },
      proposta: { create: vi.fn() },
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PedidoIndisponivelError
    );
  });

  it("lança PedidoIndisponivelError quando o pedido não está aberto", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    configurarTransacao({
      pedido: {
        findUnique: vi.fn().mockResolvedValue({ ...pedidoAberto, estado: "ATRIBUIDO" }),
        updateMany: vi.fn(),
      },
      proposta: { create: vi.fn() },
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PedidoIndisponivelError
    );
  });

  it("lança ProprioPedidoError quando o agente é dono do pedido", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    configurarTransacao({
      pedido: {
        findUnique: vi.fn().mockResolvedValue({ ...pedidoAberto, armadorId: "agente_1" }),
        updateMany: vi.fn(),
      },
      proposta: { create: vi.fn() },
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      ProprioPedidoError
    );
  });

  it("caso limite (corrida): o pedido fecha entre a leitura e a escrita — a escrita condicional apanha isso e lança PedidoIndisponivelError, sem criar a proposta", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    const txPropostaCreate = vi.fn();

    configurarTransacao({
      pedido: {
        // A leitura inicial ainda vê o pedido ABERTO...
        findUnique: vi.fn().mockResolvedValue(pedidoAberto),
        // ...mas a escrita condicional já não encontra a condição válida
        // (outra operação fechou o pedido entretanto) — count: 0.
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      proposta: { create: txPropostaCreate },
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PedidoIndisponivelError
    );
    expect(txPropostaCreate).not.toHaveBeenCalled();
  });

  it("lança PropostaDuplicadaError quando a constraint UNIQUE(pedidoId, agenteId) da base de dados dispara", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ licencaVerificada: true });
    mockTransaction.mockRejectedValue(
      new PrismaClientKnownRequestErrorSimulado("Unique constraint failed", {
        code: "P2002",
        meta: { target: ["pedidoId", "agenteId"] },
      })
    );

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PropostaDuplicadaError
    );
  });
});

describe("listarPedidosAbertosParaAgente", () => {
  beforeEach(() => {
    mockPedidoFindMany.mockReset();
  });

  it("lista apenas pedidos abertos, mais recentes primeiro, com contagem de propostas", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await listarPedidosAbertosParaAgente();

    expect(mockPedidoFindMany).toHaveBeenCalledWith({
      where: { estado: "ABERTO" },
      orderBy: { criadoEm: "desc" },
      include: { _count: { select: { propostas: true } } },
    });
  });
});

describe("listarPropostasDoAgente", () => {
  beforeEach(() => {
    mockPropostaFindMany.mockReset();
  });

  it("lista as propostas do agente com o pedido associado, mais recentes primeiro", async () => {
    mockPropostaFindMany.mockResolvedValue([]);

    await listarPropostasDoAgente("agente_1");

    expect(mockPropostaFindMany).toHaveBeenCalledWith({
      where: { agenteId: "agente_1" },
      orderBy: { criadoEm: "desc" },
      include: { pedido: true },
    });
  });
});

describe("obterPedidoAbertoParaAgente", () => {
  beforeEach(() => {
    mockPedidoFindFirst.mockReset();
  });

  it("devolve o pedido se ainda estiver aberto", async () => {
    mockPedidoFindFirst.mockResolvedValue(pedidoAberto);

    const resultado = await obterPedidoAbertoParaAgente("pedido_1");

    expect(resultado).toEqual(pedidoAberto);
    expect(mockPedidoFindFirst).toHaveBeenCalledWith({
      where: { id: "pedido_1", estado: "ABERTO" },
    });
  });

  it("devolve null quando o pedido já não está aberto", async () => {
    mockPedidoFindFirst.mockResolvedValue(null);

    const resultado = await obterPedidoAbertoParaAgente("pedido_1");

    expect(resultado).toBeNull();
  });
});
