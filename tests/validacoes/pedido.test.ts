import { describe, it, expect } from "vitest";
import { criarPedidoSchema } from "@/lib/validacoes/pedido";

function amanha(): string {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return data.toISOString().slice(0, 10);
}

function ontem(): string {
  const data = new Date();
  data.setDate(data.getDate() - 1);
  return data.toISOString().slice(0, 10);
}

describe("criarPedidoSchema", () => {
  it("aceita dados válidos com data no futuro", () => {
    const resultado = criarPedidoSchema.safeParse({
      navio: "MV Namibe Star",
      dataPrevistaChegada: amanha(),
      detalhes: "Carga geral, necessita de reboque para atracação.",
    });
    expect(resultado.success).toBe(true);
  });

  it("aceita a data de hoje (não é considerada 'passado')", () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const resultado = criarPedidoSchema.safeParse({
      navio: "MV Namibe Star",
      dataPrevistaChegada: hoje,
      detalhes: "Carga geral, necessita de reboque para atracação.",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita data prevista de chegada no passado", () => {
    const resultado = criarPedidoSchema.safeParse({
      navio: "MV Namibe Star",
      dataPrevistaChegada: ontem(),
      detalhes: "Carga geral, necessita de reboque para atracação.",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.dataPrevistaChegada?.[0]).toMatch(
        /passado/
      );
    }
  });

  it("rejeita detalhes demasiado curtos", () => {
    const resultado = criarPedidoSchema.safeParse({
      navio: "MV Namibe Star",
      dataPrevistaChegada: amanha(),
      detalhes: "curto",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome de navio vazio", () => {
    const resultado = criarPedidoSchema.safeParse({
      navio: "",
      dataPrevistaChegada: amanha(),
      detalhes: "Carga geral, necessita de reboque para atracação.",
    });
    expect(resultado.success).toBe(false);
  });
});
