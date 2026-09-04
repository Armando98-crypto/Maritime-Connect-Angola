import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNotificacaoCreate = vi.fn();
const mockNotificacaoFindMany = vi.fn();
const mockNotificacaoCount = vi.fn();
const mockNotificacaoFindUnique = vi.fn();
const mockNotificacaoUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificacao: {
      create: (...args: unknown[]) => mockNotificacaoCreate(...args),
      findMany: (...args: unknown[]) => mockNotificacaoFindMany(...args),
      count: (...args: unknown[]) => mockNotificacaoCount(...args),
      findUnique: (...args: unknown[]) => mockNotificacaoFindUnique(...args),
      update: (...args: unknown[]) => mockNotificacaoUpdate(...args),
    },
  },
}));

const {
  criarNotificacao,
  listarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  SemPermissaoNotificacaoError,
  NotificacaoNaoEncontradaError,
} = await import("@/servicos/notificacaoServico");

function resetMocks() {
  mockNotificacaoCreate.mockReset();
  mockNotificacaoFindMany.mockReset();
  mockNotificacaoCount.mockReset();
  mockNotificacaoFindUnique.mockReset();
  mockNotificacaoUpdate.mockReset();
}

describe("criarNotificacao", () => {
  beforeEach(resetMocks);

  it("cria a notificação com os dados fornecidos", async () => {
    mockNotificacaoCreate.mockResolvedValue({ id: "n1" });

    const resultado = await criarNotificacao({
      userId: "user_1",
      tipo: "PROPOSTA_RECEBIDA",
      titulo: "Nova proposta",
      mensagem: "Uma proposta foi recebida.",
      pedidoId: "pedido_1",
    });

    expect(mockNotificacaoCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        tipo: "PROPOSTA_RECEBIDA",
        titulo: "Nova proposta",
        mensagem: "Uma proposta foi recebida.",
        pedidoId: "pedido_1",
      },
    });
    expect(resultado.id).toBe("n1");
  });
});

describe("listarNotificacoes", () => {
  beforeEach(resetMocks);

  it("devolve as notificações do utilizador ordenadas por data", async () => {
    mockNotificacaoFindMany.mockResolvedValue([
      { id: "n2", titulo: "B", lida: false },
      { id: "n1", titulo: "A", lida: true },
    ]);

    const resultado = await listarNotificacoes("user_1");

    expect(mockNotificacaoFindMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensagem: true,
        lida: true,
        pedidoId: true,
        criadoEm: true,
      },
    });
    expect(resultado).toHaveLength(2);
  });
});

describe("contarNaoLidas", () => {
  beforeEach(resetMocks);

  it("devolve o número de notificações não lidas", async () => {
    mockNotificacaoCount.mockResolvedValue(3);

    const resultado = await contarNaoLidas("user_1");

    expect(mockNotificacaoCount).toHaveBeenCalledWith({
      where: { userId: "user_1", lida: false },
    });
    expect(resultado).toBe(3);
  });
});

describe("marcarComoLida", () => {
  beforeEach(resetMocks);

  it("marca como lida uma notificação do utilizador", async () => {
    mockNotificacaoFindUnique.mockResolvedValue({
      id: "n1",
      userId: "user_1",
    });
    mockNotificacaoUpdate.mockResolvedValue({});

    await marcarComoLida("n1", "user_1");

    expect(mockNotificacaoUpdate).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { lida: true },
    });
  });

  it("lança NotificacaoNaoEncontradaError se a notificação não existe", async () => {
    mockNotificacaoFindUnique.mockResolvedValue(null);

    await expect(marcarComoLida("n_x", "user_1")).rejects.toBeInstanceOf(
      NotificacaoNaoEncontradaError
    );
    expect(mockNotificacaoUpdate).not.toHaveBeenCalled();
  });

  it("lança SemPermissaoNotificacaoError se não é do utilizador", async () => {
    mockNotificacaoFindUnique.mockResolvedValue({
      id: "n1",
      userId: "outro_user",
    });

    await expect(marcarComoLida("n1", "user_1")).rejects.toBeInstanceOf(
      SemPermissaoNotificacaoError
    );
    expect(mockNotificacaoUpdate).not.toHaveBeenCalled();
  });
});
