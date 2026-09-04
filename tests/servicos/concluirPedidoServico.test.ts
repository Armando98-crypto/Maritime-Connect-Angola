import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockPedidoUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      update: (...args: unknown[]) => mockPedidoUpdate(...args),
    },
  },
}));

const {
  concluirPedido,
  PedidoNaoEncontradoError,
  SemPermissaoPedidoError,
  PedidoNaoConcluivelError,
} = await import("@/servicos/pedidoServico");

function resetMocks() {
  mockPedidoFindUnique.mockReset();
  mockPedidoUpdate.mockReset();
}

describe("concluirPedido", () => {
  beforeEach(resetMocks);

  const pedidoAtribuido = {
    id: "pedido_1",
    armadorId: "armador_1",
    estado: "ATRIBUIDO",
  };

  it("marca o pedido atribuído do armador como concluído", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAtribuido);
    mockPedidoUpdate.mockResolvedValue({ ...pedidoAtribuido, estado: "CONCLUIDO" });

    await concluirPedido("pedido_1", "armador_1");

    expect(mockPedidoUpdate).toHaveBeenCalledWith({
      where: { id: "pedido_1" },
      data: { estado: "CONCLUIDO" },
    });
  });

  it("lança PedidoNaoEncontradoError se o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    await expect(concluirPedido("pedido_x", "armador_1")).rejects.toBeInstanceOf(
      PedidoNaoEncontradoError
    );
  });

  it("lança SemPermissaoPedidoError se o pedido não pertence ao armador", async () => {
    mockPedidoFindUnique.mockResolvedValue({
      ...pedidoAtribuido,
      armadorId: "outro",
    });

    await expect(concluirPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
      SemPermissaoPedidoError
    );
  });

  it("lança PedidoNaoConcluivelError se o pedido não está atribuído", async () => {
    for (const estado of ["ABERTO", "CONCLUIDO", "CANCELADO"]) {
      mockPedidoFindUnique.mockResolvedValue({ ...pedidoAtribuido, estado });
      await expect(concluirPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
        PedidoNaoConcluivelError
      );
    }
    expect(mockPedidoUpdate).not.toHaveBeenCalled();
  });
});
