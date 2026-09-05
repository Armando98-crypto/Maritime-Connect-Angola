import { describe, it, expect, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const mockPedidoFindUnique = vi.fn();
const mockPedidoFindMany = vi.fn();
const mockComissaoFindUnique = vi.fn();
const mockComissaoUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findUnique: (...args: unknown[]) => mockPedidoFindUnique(...args),
      findMany: (...args: unknown[]) => mockPedidoFindMany(...args),
    },
    comissao: {
      findUnique: (...args: unknown[]) => mockComissaoFindUnique(...args),
      update: (...args: unknown[]) => mockComissaoUpdate(...args),
    },
  },
}));

const {
  calcularValorComissao,
  PERCENTAGEM_COMISSAO,
  listarComissoesDoAgente,
  anexarComprovativo,
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
  ComprovativoInvalidoError,
  SemPermissaoComissaoError,
} = await import("@/servicos/comissaoServico");

function resetMocks() {
  mockPedidoFindUnique.mockReset();
  mockPedidoFindMany.mockReset();
  mockComissaoFindUnique.mockReset();
  mockComissaoUpdate.mockReset();
}

describe("calcularValorComissao", () => {
  it("aplica a percentagem fixa ao valor base, devolvendo sempre um Decimal", () => {
    expect(PERCENTAGEM_COMISSAO).toBe(10);
    expect(calcularValorComissao(100_000).toString()).toBe("10000");
    expect(calcularValorComissao(50_000).toString()).toBe("5000");
    expect(calcularValorComissao(12_345.67).toString()).toBe("1234.57");
    expect(calcularValorComissao(100_000)).toBeInstanceOf(Decimal);
  });

  it("não perde precisão em valores onde a aritmética float falharia (regressão do bug de arredondamento)", () => {
    // Em JavaScript, 19.99 * 10 / 100 dá 1.9990000000000003 (erro de
    // float). Com Decimal.js, o resultado é exacto.
    expect(calcularValorComissao(19.99).toString()).toBe("2");
    expect(calcularValorComissao(0.1).toString()).toBe("0.01");
    expect(calcularValorComissao(29.99).toString()).toBe("3");
  });

  it("aceita directamente uma instância Decimal (como as que o Prisma devolve para campos Decimal)", () => {
    const valorBase = new Decimal("100000.00");
    expect(calcularValorComissao(valorBase).toString()).toBe("10000");
  });
});

describe("listarComissoesDoAgente", () => {
  beforeEach(resetMocks);

  it("devolve as comissões dos pedidos onde o agente foi o escolhido", async () => {
    mockPedidoFindMany.mockResolvedValue([
      {
        id: "pedido_1",
        navio: "Libra",
        comissao: {
          id: "com_1",
          pedidoId: "pedido_1",
          valorComissao: 1000,
          percentagem: 10,
          estado: "PENDENTE",
        },
      },
      {
        id: "pedido_2",
        navio: "Orion",
        comissao: null,
      },
    ]);

    const resultado = await listarComissoesDoAgente("agente_1");

    expect(mockPedidoFindMany).toHaveBeenCalledWith({
      where: { propostaAceite: { agenteId: "agente_1" } },
      orderBy: { criadoEm: "desc" },
      select: { id: true, navio: true, comissao: true },
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      pedidoId: "pedido_1",
      navio: "Libra",
      id: "com_1",
      estado: "PENDENTE",
    });
  });

  it("devolve lista vazia se o agente não tem pedidos", async () => {
    mockPedidoFindMany.mockResolvedValue([]);

    await expect(listarComissoesDoAgente("agente_1")).resolves.toEqual([]);
  });
});

describe("anexarComprovativo", () => {
  // Bytes reais de um cabeçalho de PDF válido -- não basta qualquer
  // buffer com o Content-Type "application/pdf" declarado.
  const pdfValido = Buffer.concat([
    Buffer.from("%PDF-1.4\n"),
    Buffer.from([1, 2, 3, 4, 5]),
  ]);

  const comprovativo = {
    nome: "comprovativo.pdf",
    tipo: "application/pdf",
    tamanho: pdfValido.byteLength,
    dados: pdfValido,
  };

  beforeEach(resetMocks);

  it("anexa o comprovativo a uma comissão PENDENTE do agente dono, quando a assinatura do ficheiro é válida", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "agente_1" },
    });
    mockComissaoUpdate.mockResolvedValue({});

    await anexarComprovativo("com_1", "agente_1", comprovativo);

    const chamada = mockComissaoUpdate.mock.calls[0][0] as {
      where: { id: string };
      data: { comprovativoNome: string; comprovativoTipo: string };
    };

    expect(chamada.where).toEqual({ id: "com_1" });
    expect(chamada.data.comprovativoNome).toBe(comprovativo.nome);
    expect(chamada.data.comprovativoTipo).toBe(comprovativo.tipo);
  });

  it("rejeita um ficheiro cujos bytes não correspondem ao tipo declarado (Content-Type falsificado) — não confia só no que o browser diz", async () => {
    const ficheiroDisfarcado = {
      nome: "nao-e-um-pdf.pdf",
      tipo: "application/pdf",
      tamanho: 5,
      // Bytes arbitrários, sem qualquer assinatura de PDF real.
      dados: Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]),
    };

    await expect(
      anexarComprovativo("com_1", "agente_1", ficheiroDisfarcado)
    ).rejects.toBeInstanceOf(ComprovativoInvalidoError);
    expect(mockComissaoFindUnique).not.toHaveBeenCalled();
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("aceita PNG, JPEG e WebP com a assinatura de bytes correcta", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "agente_1" },
    });
    mockComissaoUpdate.mockResolvedValue({});

    const png = {
      nome: "c.png",
      tipo: "image/png",
      tamanho: 12,
      dados: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
    };
    const jpeg = {
      nome: "c.jpg",
      tipo: "image/jpeg",
      tamanho: 12,
      dados: Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    };
    const webp = {
      nome: "c.webp",
      tipo: "image/webp",
      tamanho: 12,
      dados: Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]),
    };

    await expect(anexarComprovativo("com_1", "agente_1", png)).resolves.toBeDefined();
    await expect(anexarComprovativo("com_1", "agente_1", jpeg)).resolves.toBeDefined();
    await expect(anexarComprovativo("com_1", "agente_1", webp)).resolves.toBeDefined();
  });

  it("lança ComissaoNaoEncontradaError se a comissão não existe", async () => {
    mockComissaoFindUnique.mockResolvedValue(null);

    await expect(
      anexarComprovativo("com_x", "agente_1", comprovativo)
    ).rejects.toBeInstanceOf(ComissaoNaoEncontradaError);
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("lança SemPermissaoComissaoError se o agente não é o dono", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PENDENTE",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "outro_agente" },
    });

    await expect(
      anexarComprovativo("com_1", "agente_1", comprovativo)
    ).rejects.toBeInstanceOf(SemPermissaoComissaoError);
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("lança ComissaoJaPagaError se a comissão já está paga", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      pedidoId: "pedido_1",
      estado: "PAGA",
    });
    mockPedidoFindUnique.mockResolvedValue({
      propostaAceite: { agenteId: "agente_1" },
    });

    await expect(
      anexarComprovativo("com_1", "agente_1", comprovativo)
    ).rejects.toBeInstanceOf(ComissaoJaPagaError);
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });
});
