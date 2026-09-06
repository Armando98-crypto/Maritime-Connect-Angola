import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPerfilFindUnique = vi.fn();
const mockPerfilUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    perfilAgente: {
      findUnique: (...args: unknown[]) => mockPerfilFindUnique(...args),
      update: (...args: unknown[]) => mockPerfilUpdate(...args),
    },
  },
}));

const {
  obterPerfilAgente,
  atualizarPerfilAgente,
  PerfilNaoEncontradoError,
} = await import("@/servicos/perfilServico");

function resetMocks() {
  mockPerfilFindUnique.mockReset();
  mockPerfilUpdate.mockReset();
}

describe("obterPerfilAgente", () => {
  beforeEach(resetMocks);

  it("devolve o perfil com dados do utilizador", async () => {
    mockPerfilFindUnique.mockResolvedValue({
      userId: "user_1",
      nomeEmpresa: "Kolela",
      numeroLicenca: "LIC-001",
      licencaVerificada: true,
      user: { nome: "Agente", email: "ag@test.com", criadoEm: new Date() },
    });

    const perfil = await obterPerfilAgente("user_1");

    expect(perfil).toBeTruthy();
    expect(perfil!.nomeEmpresa).toBe("Kolela");
    expect(perfil!.user.nome).toBe("Agente");
  });

  it("devolve null se o perfil não existe", async () => {
    mockPerfilFindUnique.mockResolvedValue(null);

    await expect(obterPerfilAgente("user_x")).resolves.toBeNull();
  });
});

describe("atualizarPerfilAgente", () => {
  beforeEach(resetMocks);

  it("actualiza o nome da empresa", async () => {
    mockPerfilFindUnique.mockResolvedValue({ userId: "user_1" });
    mockPerfilUpdate.mockResolvedValue({});

    await atualizarPerfilAgente("user_1", { nomeEmpresa: "Nova Empresa" });

    expect(mockPerfilUpdate).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      data: { nomeEmpresa: "Nova Empresa" },
    });
  });

  it("lança PerfilNaoEncontradoError se o perfil não existe", async () => {
    mockPerfilFindUnique.mockResolvedValue(null);

    await expect(
      atualizarPerfilAgente("user_x", { nomeEmpresa: "X" })
    ).rejects.toBeInstanceOf(PerfilNaoEncontradoError);
    expect(mockPerfilUpdate).not.toHaveBeenCalled();
  });
});
