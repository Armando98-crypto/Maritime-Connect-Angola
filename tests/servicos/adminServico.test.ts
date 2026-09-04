import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindMany = vi.fn();
const mockPerfilAgenteFindUnique = vi.fn();
const mockPerfilAgenteFindMany = vi.fn();
const mockPerfilAgenteUpdate = vi.fn();
const mockComissaoFindMany = vi.fn();
const mockComissaoFindUnique = vi.fn();
const mockComissaoUpdate = vi.fn();
const mockComissaoCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    perfilAgente: {
      findUnique: (...args: unknown[]) => mockPerfilAgenteFindUnique(...args),
      findMany: (...args: unknown[]) => mockPerfilAgenteFindMany(...args),
      update: (...args: unknown[]) => mockPerfilAgenteUpdate(...args),
    },
    comissao: {
      findMany: (...args: unknown[]) => mockComissaoFindMany(...args),
      findUnique: (...args: unknown[]) => mockComissaoFindUnique(...args),
      update: (...args: unknown[]) => mockComissaoUpdate(...args),
      count: (...args: unknown[]) => mockComissaoCount(...args),
    },
  },
}));

const {
  listarAgentes,
  definirVerificacaoLicenca,
  listarComissoes,
  confirmarPagamentoComissao,
  obterComprovativoComissao,
  obterResumoAdmin,
  AgenteNaoEncontradoError,
} = await import("@/servicos/adminServico");

const {
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
  ComissaoSemComprovativoError,
} = await import("@/servicos/comissaoServico");

function resetMocks() {
  mockUserFindMany.mockReset();
  mockPerfilAgenteFindUnique.mockReset();
  mockPerfilAgenteFindMany.mockReset();
  mockPerfilAgenteUpdate.mockReset();
  mockComissaoFindMany.mockReset();
  mockComissaoFindUnique.mockReset();
  mockComissaoUpdate.mockReset();
  mockComissaoCount.mockReset();
}

describe("listarAgentes", () => {
  beforeEach(resetMocks);

  it("devolve os agentes com o perfil, ordenados por criação", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: "agente_1",
        nome: "Ana",
        email: "ana@example.com",
        criadoEm: new Date("2024-01-02"),
        perfilAgente: {
          nomeEmpresa: "Marítima do Namibe",
          numeroLicenca: "LIC-001",
          licencaVerificada: false,
        },
      },
    ]);

    const resultado = await listarAgentes();

    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: { papel: "AGENTE" },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        nome: true,
        email: true,
        criadoEm: true,
        perfilAgente: {
          select: {
            nomeEmpresa: true,
            numeroLicenca: true,
            licencaVerificada: true,
          },
        },
      },
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].perfilAgente?.licencaVerificada).toBe(false);
  });
});

describe("definirVerificacaoLicenca", () => {
  beforeEach(resetMocks);

  it("marca a licença como verificada quando o perfil existe", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ userId: "agente_1" });
    mockPerfilAgenteUpdate.mockResolvedValue({});

    await definirVerificacaoLicenca("agente_1", true);

    expect(mockPerfilAgenteUpdate).toHaveBeenCalledWith({
      where: { userId: "agente_1" },
      data: { licencaVerificada: true },
    });
  });

  it("também permite voltar a marcar como pendente", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue({ userId: "agente_1" });
    mockPerfilAgenteUpdate.mockResolvedValue({});

    await definirVerificacaoLicenca("agente_1", false);

    expect(mockPerfilAgenteUpdate).toHaveBeenCalledWith({
      where: { userId: "agente_1" },
      data: { licencaVerificada: false },
    });
  });

  it("lança AgenteNaoEncontradoError se o perfil não existe", async () => {
    mockPerfilAgenteFindUnique.mockResolvedValue(null);

    await expect(definirVerificacaoLicenca("user_x", true)).rejects.toBeInstanceOf(
      AgenteNaoEncontradoError
    );
    expect(mockPerfilAgenteUpdate).not.toHaveBeenCalled();
  });
});

describe("listarComissoes", () => {
  beforeEach(resetMocks);

  it("devolve as comissões com navio e agente da proposta aceite", async () => {
    mockComissaoFindMany.mockResolvedValue([
      {
        id: "com_1",
        valorBase: 100_000,
        percentagem: 10,
        valorComissao: 10_000,
        estado: "PENDENTE",
        criadoEm: new Date("2024-01-02"),
        pedido: {
          navio: "Libra",
          propostaAceite: {
            agente: {
              nome: "Ana",
              perfilAgente: { nomeEmpresa: "Marítima do Namibe" },
            },
          },
        },
      },
    ]);

    const resultado = await listarComissoes();

    expect(mockComissaoFindMany).toHaveBeenCalledWith({
      orderBy: { criadoEm: "desc" },
      select: expect.any(Object),
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].pedido.navio).toBe("Libra");
  });
});

describe("confirmarPagamentoComissao", () => {
  beforeEach(resetMocks);

  it("marca como PAGA uma comissão PENDENTE com comprovativo anexado", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      estado: "PENDENTE",
      comprovativoNome: "comprovativo.pdf",
    });
    mockComissaoUpdate.mockResolvedValue({});

    await confirmarPagamentoComissao("com_1");

    expect(mockComissaoUpdate).toHaveBeenCalledWith({
      where: { id: "com_1" },
      data: { estado: "PAGA" },
    });
  });

  it("lança ComissaoNaoEncontradaError se a comissão não existe", async () => {
    mockComissaoFindUnique.mockResolvedValue(null);

    await expect(confirmarPagamentoComissao("com_x")).rejects.toBeInstanceOf(
      ComissaoNaoEncontradaError
    );
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("lança ComissaoJaPagaError se a comissão já está paga", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      estado: "PAGA",
      comprovativoNome: "comprovativo.pdf",
    });

    await expect(confirmarPagamentoComissao("com_1")).rejects.toBeInstanceOf(
      ComissaoJaPagaError
    );
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });

  it("lança ComissaoSemComprovativoError se ainda não há comprovativo", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      id: "com_1",
      estado: "PENDENTE",
      comprovativoNome: null,
    });

    await expect(confirmarPagamentoComissao("com_1")).rejects.toBeInstanceOf(
      ComissaoSemComprovativoError
    );
    expect(mockComissaoUpdate).not.toHaveBeenCalled();
  });
});

describe("obterComprovativoComissao", () => {
  beforeEach(resetMocks);

  it("devolve os dados do comprovativo quando existe", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      comprovativoNome: "comprovativo.pdf",
      comprovativoTipo: "application/pdf",
      comprovativoDados: Buffer.from([1, 2, 3]),
    });

    const resultado = await obterComprovativoComissao("com_1");

    expect(mockComissaoFindUnique).toHaveBeenCalledWith({
      where: { id: "com_1" },
      select: {
        comprovativoNome: true,
        comprovativoTipo: true,
        comprovativoDados: true,
      },
    });
    expect(resultado.comprovativoNome).toBe("comprovativo.pdf");
  });

  it("lança ComissaoNaoEncontradaError se a comissão não existe", async () => {
    mockComissaoFindUnique.mockResolvedValue(null);

    await expect(obterComprovativoComissao("com_x")).rejects.toBeInstanceOf(
      ComissaoNaoEncontradaError
    );
  });

  it("lança ComissaoSemComprovativoError se não há dados anexados", async () => {
    mockComissaoFindUnique.mockResolvedValue({
      comprovativoNome: null,
      comprovativoTipo: null,
      comprovativoDados: null,
    });

    await expect(obterComprovativoComissao("com_1")).rejects.toBeInstanceOf(
      ComissaoSemComprovativoError
    );
  });
});

describe("obterResumoAdmin", () => {
  beforeEach(resetMocks);

  it("conta agentes por verificar e comissões pendentes", async () => {
    mockPerfilAgenteFindMany.mockResolvedValue([{ userId: "agente_1" }]);
    mockComissaoCount.mockResolvedValue(3);

    const resumo = await obterResumoAdmin();

    expect(mockPerfilAgenteFindMany).toHaveBeenCalledWith({
      where: { licencaVerificada: false },
      select: { userId: true },
    });
    expect(mockComissaoCount).toHaveBeenCalledWith({
      where: { estado: "PENDENTE" },
    });
    expect(resumo).toEqual({ agentesPorVerificar: 1, comissoesPendentes: 3 });
  });
});