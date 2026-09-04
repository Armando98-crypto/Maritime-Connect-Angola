"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { criarAvaliacaoSchema } from "@/lib/validacoes/avaliacao";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface AvaliarPedidoProps {
  pedidoId: string;
  navio: string;
}

const estadoInicial = { nota: "", comentario: "" };

type Campos = typeof estadoInicial;
type ErrosCampo = Partial<Record<keyof Campos, string>>;

export function AvaliarPedido({ pedidoId, navio }: AvaliarPedidoProps) {
  const router = useRouter();
  const [campos, setCampos] = useState<Campos>(estadoInicial);
  const [erros, setErros] = useState<ErrosCampo>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  function actualizarCampo<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function validar(): boolean {
    const resultado = criarAvaliacaoSchema.safeParse({
      nota: campos.nota ? Number(campos.nota) : undefined,
      comentario: campos.comentario || null,
    });

    if (resultado.success) {
      setErros({});
      return true;
    }

    const { fieldErrors } = resultado.error.flatten();
    setErros({
      nota: fieldErrors.nota?.[0],
      comentario: fieldErrors.comentario?.[0],
    });
    return false;
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    if (!validar()) {
      return;
    }
    await enviarAvaliacao();
  }

  async function enviarAvaliacao() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          nota: Number(campos.nota),
          comentario: campos.comentario || null,
        }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível avaliar o pedido. Tente novamente.");
        return;
      }

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
    <form onSubmit={submeter} className="mt-3 flex flex-col gap-4" noValidate>
      <div className="rounded-lg border border-slate-200 px-4 py-3">
        <p className="text-sm text-slate-600">
          Avalie o serviço prestado no pedido <strong>{navio}</strong>.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <Select
            label="Nota (1 a 5)"
            name="nota"
            value={campos.nota}
            onChange={(e) => actualizarCampo("nota", e.target.value)}
            erro={erros.nota}
          >
            <option value="">Seleccione a nota</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "estrela" : "estrelas"}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1">
            <label htmlFor="comentario" className="text-sm font-medium text-slate-700">
              Comentário (opcional)
            </label>
            <textarea
              id="comentario"
              name="comentario"
              rows={3}
              value={campos.comentario}
              onChange={(e) => actualizarCampo("comentario", e.target.value)}
              aria-invalid={erros.comentario ? "true" : "false"}
              aria-describedby={erros.comentario ? "comentario-erro" : undefined}
              className={`rounded-md border px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-sky-500 ${
                erros.comentario ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Como foi o serviço prestado?"
              maxLength={500}
            />
            {erros.comentario && (
              <p id="comentario-erro" className="text-sm text-red-600">
                {erros.comentario}
              </p>
            )}
          </div>
        </div>

        {erroGeral && (
          <div className="mt-4">
            <ErroFormulario mensagem={erroGeral} aoTentarNovamente={enviarAvaliacao} />
          </div>
        )}

        <Button type="submit" aCarregar={aCarregar} className="mt-4">
          Enviar avaliação
        </Button>
      </div>
    </form>
  );
}