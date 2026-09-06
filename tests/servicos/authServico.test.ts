import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do Prisma Client: os testes desta fatia validam a LÓGICA DE
// NEGÓCIO (transações, tradução de erros de constraint, hashing), não
// o comportamento real do Postgres — isso fica coberto por testes de
// integração, fora do âmbito desta fatia. Mockamos também "@prisma/client"
// em si (não só "@/lib/prisma") porque o pacote gerado exige que
// `npx prisma generate` tenha corrido com sucesso (o que descarrega o
// motor binário da Prisma); os testes unitários não devem depender disso.
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

const mockUserCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => mockUserCreate(...args),
      findUnique: vi.fn(),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hash-simulado"),
    compare: vi.fn(),
  },
}));

const {
  criarUtilizador,
  EmailJaExisteError,
  LicencaJaExisteError,
} = await import("@/servicos/authServico");

function erroConstraintUnica(campo: string) {
  return new PrismaClientKnownRequestErrorSimulado("Unique constraint failed", {
    code: "P2002",
    meta: { target: [campo] },
  });
}

describe("criarUtilizador", () => {
  beforeEach(() => {
    mockUserCreate.mockReset();
    mockTransaction.mockReset();
  });

  it("cria um armador com sucesso, sem tocar em perfilAgente", async () => {
    mockUserCreate.mockResolvedValue({
      id: "user_1",
      nome: "João Armador",
      email: "joao@exemplo.com",
      papel: "ARMADOR",
    });

    const resultado = await criarUtilizador({
      nome: "João Armador",
      email: "Joao@Exemplo.com",
      password: "palavrapasse123",
      papel: "ARMADOR",
    });

    expect(resultado.papel).toBe("ARMADOR");
    // Email normalizado para minúsculas antes de gravar.
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "joao@exemplo.com" }),
      })
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("cria um agente com sucesso dentro de uma transacção (User + PerfilAgente)", async () => {
    const txUserCreate = vi.fn().mockResolvedValue({
      id: "user_2",
      nome: "Maria Agente",
      email: "maria@exemplo.com",
      papel: "AGENTE",
    });
    const txPerfilCreate = vi.fn().mockResolvedValue({});

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        user: { create: txUserCreate },
        perfilAgente: { create: txPerfilCreate },
      })
    );

    const resultado = await criarUtilizador({
      nome: "Maria Agente",
      email: "maria@exemplo.com",
      password: "palavrapasse123",
      papel: "AGENTE",
      nomeEmpresa: "Agência Maria Lda",
      numeroLicenca: "NAM-001",
    });

    expect(resultado.papel).toBe("AGENTE");
    expect(txUserCreate).toHaveBeenCalledTimes(1);
    // O perfil só é criado com licencaVerificada = false por omissão —
    // verificação manual é feita directamente na base de dados.
    expect(txPerfilCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numeroLicenca: "NAM-001",
          licencaVerificada: false,
        }),
      })
    );
  });

  it("traduz violação de email duplicado em EmailJaExisteError", async () => {
    mockUserCreate.mockRejectedValue(erroConstraintUnica("email"));

    await expect(
      criarUtilizador({
        nome: "Duplicado",
        email: "existente@exemplo.com",
        password: "palavrapasse123",
        papel: "ARMADOR",
      })
    ).rejects.toBeInstanceOf(EmailJaExisteError);
  });

  it("traduz violação de licença duplicada em LicencaJaExisteError (agente)", async () => {
    mockTransaction.mockRejectedValue(erroConstraintUnica("numeroLicenca"));

    await expect(
      criarUtilizador({
        nome: "Agente Duplicado",
        email: "novo@exemplo.com",
        password: "palavrapasse123",
        papel: "AGENTE",
        nomeEmpresa: "Empresa",
        numeroLicenca: "NAM-001",
      })
    ).rejects.toBeInstanceOf(LicencaJaExisteError);
  });

  it("caso limite: duas submissões quase simultâneas com o mesmo email — a segunda falha de forma limpa", async () => {
    // A primeira "chega" à base de dados e passa a constraint.
    mockUserCreate
      .mockResolvedValueOnce({
        id: "user_3",
        nome: "Primeiro",
        email: "corrida@exemplo.com",
        papel: "ARMADOR",
      })
      // A segunda, mesmo que tenha passado por uma validação prévia
      // optimista, esbarra na constraint UNIQUE da base de dados.
      .mockRejectedValueOnce(erroConstraintUnica("email"));

    const dados = {
      nome: "Corrida",
      email: "corrida@exemplo.com",
      password: "palavrapasse123",
      papel: "ARMADOR" as const,
    };

    const primeira = await criarUtilizador(dados);
    expect(primeira.email).toBe("corrida@exemplo.com");

    await expect(criarUtilizador(dados)).rejects.toBeInstanceOf(EmailJaExisteError);
  });

  it("propaga erros inesperados sem os disfarçar de erro de duplicação", async () => {
    mockUserCreate.mockRejectedValue(new Error("falha de ligação à base de dados"));

    await expect(
      criarUtilizador({
        nome: "Falha",
        email: "falha@exemplo.com",
        password: "palavrapasse123",
        papel: "ARMADOR",
      })
    ).rejects.toThrow("falha de ligação à base de dados");
  });
});
