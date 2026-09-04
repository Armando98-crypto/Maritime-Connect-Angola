"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { criarPropostaSchema } from "@/lib/validacoes/proposta";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

const estadoInicial = {
  preco: "",
  prazoDias: "",
};

type Campos = typeof estadoInicial;
type ErrosCampo = Partial<Record<keyof Campos, string>>;

interface PropostaFormProps {
  pedidoId: string;
}

export function PropostaForm({ pedidoId }: PropostaFormProps) {
  const router = useRouter();
  const [campos, setCampos] = useState<Campos>(estadoInicial);
  const [erros, setErros] = useState<ErrosCampo>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  function actualizarCampo<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function validar(): boolean {
    const resultado = criarPropostaSchema.safeParse({
      pedidoId,
      preco: campos.preco ? Number(campos.preco) : undefined,
      prazoDias: campos.prazoDias ? Number(campos.prazoDias) : undefined,
    });

    if (resultado.success) {
      setErros({});
      return true;
    }

    const { fieldErrors } = resultado.error.flatten();
    setErros({
      preco: fieldErrors.preco?.[0],
      prazoDias: fieldErrors.prazoDias?.[0],
    });
    return false;
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    if (!validar()) {
      return;
    }
    await enviarProposta();
  }

  async function enviarProposta() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch("/api/propostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          preco: Number(campos.preco),
          prazoDias: Number(campos.prazoDias),
        }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível enviar a proposta. Tente novamente.");
        return;
      }

      router.push("/agente/pedidos");
      router.refresh();
    } catch {
      setErroGeral(
        "Não foi possível ligar ao servidor. Verifique a ligação e tente de novo."
      );
    } finally {
      setACarregar(false);
    }
  }

  return (
    <form onSubmit={submeter} className="mt-6 flex flex-col gap-4" noValidate>
      <Input
        label="Preço (Kz)"
        name="preco"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={campos.preco}
        onChange={(e) => actualizarCampo("preco", e.target.value)}
        erro={erros.preco}
      />

      <Input
        label="Prazo de serviço (dias)"
        name="prazoDias"
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        value={campos.prazoDias}
        onChange={(e) => actualizarCampo("prazoDias", e.target.value)}
        erro={erros.prazoDias}
      />

      {erroGeral && (
        <ErroFormulario mensagem={erroGeral} aoTentarNovamente={enviarProposta} />
      )}

      <Button type="submit" aCarregar={aCarregar}>
        Enviar proposta
      </Button>
    </form>
  );
}