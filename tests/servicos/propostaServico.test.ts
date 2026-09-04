import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockPedidoFindFirst = vi.fn();
const mockPedidoFindMany = vi.fn();
const mockPropostaCreate = vi.fn();
const mockPropostaFindFirst = vi.fn();
const mockPropostaFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      findFirst: (...args: unknown[]) => mockPedidoFindFirst(...args),
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
    },
    proposta: {
      create: (...args: unknown[]) => mockPropostaCreate(...args),
      findFirst: (...args: unknown[]) => mockPropostaFindFirst(...args),
      findMany: (...args: unknown[]) => mockPropostaFindMany(...args),
    },
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
} = await import("@/servicos/propostaServico");

const pedidoAberto = {
  id: "pedido_1",
  armadorId: "armador_1",
  estado: "ABERTO",
  propostaAceiteId: null,
};

function dadosValidos() {
  return { pedidoId: "pedido_1", preco: 250_000, prazoDias: 5 };
}

describe("criarProposta", () => {
  beforeEach(() => {
    mockPedidoFindUnique.mockReset();
    mockPropostaFindFirst.mockReset();
    mockPropostaCreate.mockReset();
  });

  it("cria a proposta quando o pedido está aberto e sem proposta aceite", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAberto);
    mockPropostaFindFirst.mockResolvedValue(null);
    mockPropostaCreate.mockResolvedValue({ id: "proposta_1" });

    await criarProposta("agente_1", dadosValidos());

    expect(mockPropostaCreate).toHaveBeenCalledWith({
      data: {
        pedidoId: "pedido_1",
        agenteId: "agente_1",
        preco: 250_000,
        prazoDias: 5,
      },
    });
  });

  it("lança PedidoIndisponivelError quando o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PedidoIndisponivelError
    );
    expect(mockPropostaCreate).not.toHaveBeenCalled();
  });

  it("lança PedidoIndisponivelError quando o pedido não está aberto", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoAberto,
      estado: "ATRIBUIDO",
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PedidoIndisponivelError
    );
  });

  it("lança PedidoIndisponivelError quando o pedido já tem proposta aceite", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoAberto,
      propostaAceiteId: "proposta_x",
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PedidoIndisponivelError
    );
  });

  it("lança ProprioPedidoError quando o agente é dono do pedido", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoAberto,
      armadorId: "agente_1",
    });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      ProprioPedidoError
    );
    expect(mockPropostaCreate).not.toHaveBeenCalled();
  });

  it("lança PropostaDuplicadaError quando o agente já propôs este pedido", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAberto);
    mockPropostaFindFirst.mockResolvedValue({ id: "proposta_anterior" });

    await expect(criarProposta("agente_1", dadosValidos())).rejects.toBeInstanceOf(
      PropostaDuplicadaError
    );
    expect(mockPropostaCreate).not.toHaveBeenCalled();
  });

  it("verifica a duplicação com o par pedido + agente", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAberto);
    mockPropostaFindFirst.mockResolvedValue(null);
    mockPropostaCreate.mockResolvedValue({ id: "proposta_1" });

    await criarProposta("agente_1", dadosValidos());

    expect(mockPropostaFindFirst).toHaveBeenCalledWith({
      where: { pedidoId: "pedido_1", agenteId: "agente_1" },
    });
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
