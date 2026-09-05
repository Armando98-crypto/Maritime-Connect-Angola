import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPedidoFindUnique = vi.fn();
const mockPedidoUpdateMany = vi.fn();
const mockPedidoFindUniqueOrThrow = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      updateMany: (...args: unknown[]) => mockPedidoUpdateMany(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockPedidoFindUniqueOrThrow(...args),
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
  mockPedidoUpdateMany.mockReset();
  mockPedidoFindUniqueOrThrow.mockReset();
}

describe("concluirPedido", () => {
  beforeEach(resetMocks);

  const pedidoAtribuido = { id: "pedido_1", armadorId: "armador_1" };

  it("marca o pedido atribuído do armador como concluído (escrita condicional)", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAtribuido);
    mockPedidoUpdateMany.mockResolvedValue({ count: 1 });
    mockPedidoFindUniqueOrThrow.mockResolvedValue({
      ...pedidoAtribuido,
      estado: "CONCLUIDO",
    });

    await concluirPedido("pedido_1", "armador_1");

    // A condição de estado vai no próprio WHERE da escrita -- só
    // conclui se, no momento exacto da escrita, ainda estiver
    // ATRIBUIDO. Consistente com o mesmo padrão usado em
    // aceitarProposta/cancelarPedido.
    expect(mockPedidoUpdateMany).toHaveBeenCalledWith({
      where: { id: "pedido_1", estado: "ATRIBUIDO" },
      data: { estado: "CONCLUIDO" },
    });
  });

  it("lança PedidoNaoEncontradoError se o pedido não existe", async () => {
    mockPedidoFindUnique.mockResolvedValue(null);

    await expect(concluirPedido("pedido_x", "armador_1")).rejects.toBeInstanceOf(
      PedidoNaoEncontradoError
    );
    expect(mockPedidoUpdateMany).not.toHaveBeenCalled();
  });

  it("lança SemPermissaoPedidoError se o pedido não pertence ao armador", async () => {
    mockPedidoFindUnique.mockResolvedValue({ ...pedidoAtribuido, armadorId: "outro" });

    await expect(concluirPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
      SemPermissaoPedidoError
    );
    expect(mockPedidoUpdateMany).not.toHaveBeenCalled();
  });

  it("lança PedidoNaoConcluivelError se o pedido não está atribuído no momento da escrita", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAtribuido);
    mockPedidoUpdateMany.mockResolvedValue({ count: 0 });

    await expect(concluirPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
      PedidoNaoConcluivelError
    );
  });

  it("caso limite (corrida): o pedido é cancelado entre a leitura e a escrita -- a escrita condicional apanha isso, sem sobrepor o cancelamento", async () => {
    mockPedidoFindUnique.mockResolvedValue(pedidoAtribuido);
    // A leitura inicial nem sequer verifica o estado (só existência e
    // dono) -- é a escrita condicional que decide, em cima da versão
    // mais recente da linha, se ainda está ATRIBUIDO.
    mockPedidoUpdateMany.mockResolvedValue({ count: 0 });

    await expect(concluirPedido("pedido_1", "armador_1")).rejects.toBeInstanceOf(
      PedidoNaoConcluivelError
    );
  });
});
