import { describe, it, expect } from "vitest";
import { criarAvaliacaoSchema } from "@/lib/validacoes/avaliacao";

describe("criarAvaliacaoSchema", () => {
  it("aceita uma nota válida sem comentário", () => {
    const resultado = criarAvaliacaoSchema.safeParse({ nota: 5 });
    expect(resultado.success).toBe(true);
  });

  it("aceita uma nota válida com comentário", () => {
    const resultado = criarAvaliacaoSchema.safeParse({
      nota: 4,
      comentario: "Bom serviço",
    });
    expect(resultado.success).toBe(true);
  });

  it("aceita comentário nulo (do formulário vazio)", () => {
    const resultado = criarAvaliacaoSchema.safeParse({ nota: 3, comentario: null });
    expect(resultado.success).toBe(true);
  });

  it("rejeita nota abaixo de 1", () => {
    const resultado = criarAvaliacaoSchema.safeParse({ nota: 0 });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nota acima de 5", () => {
    const resultado = criarAvaliacaoSchema.safeParse({ nota: 6 });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nota não inteira", () => {
    const resultado = criarAvaliacaoSchema.safeParse({ nota: 4.5 });
    expect(resultado.success).toBe(false);
  });

  it("rejeita comentário demasiado longo", () => {
    const resultado = criarAvaliacaoSchema.safeParse({
      nota: 5,
      comentario: "x".repeat(501),
    });
    expect(resultado.success).toBe(false);
  });
});
