import { describe, it, expect } from "vitest";
import { criarPropostaSchema } from "@/lib/validacoes/proposta";

describe("criarPropostaSchema", () => {
  it("aceita uma proposta válida", () => {
    const resultado = criarPropostaSchema.safeParse({
      pedidoId: "pedido_1",
      preco: 250_000,
      prazoDias: 5,
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita pedido em falta/vazio", () => {
    const resultado = criarPropostaSchema.safeParse({
      pedidoId: "",
      preco: 250_000,
      prazoDias: 5,
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.pedidoId?.[0]).toMatch(
        /obrigatório/
      );
    }
  });

  it("rejeita preço zero ou negativo", () => {
    for (const preco of [0, -10]) {
      const resultado = criarPropostaSchema.safeParse({
        pedidoId: "pedido_1",
        preco,
        prazoDias: 5,
      });
      expect(resultado.success).toBe(false);
    }
  });

  it("rejeita preço demasiado alto", () => {
    const resultado = criarPropostaSchema.safeParse({
      pedidoId: "pedido_1",
      preco: 1_000_000_001,
      prazoDias: 5,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita prazo não inteiro", () => {
    const resultado = criarPropostaSchema.safeParse({
      pedidoId: "pedido_1",
      preco: 250_000,
      prazoDias: 5.5,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita prazo zero ou negativo", () => {
    for (const prazoDias of [0, -1]) {
      const resultado = criarPropostaSchema.safeParse({
        pedidoId: "pedido_1",
        preco: 250_000,
        prazoDias,
      });
      expect(resultado.success).toBe(false);
    }
  });

  it("rejeita prazo acima de 365 dias", () => {
    const resultado = criarPropostaSchema.safeParse({
      pedidoId: "pedido_1",
      preco: 250_000,
      prazoDias: 366,
    });
    expect(resultado.success).toBe(false);
  });
});
