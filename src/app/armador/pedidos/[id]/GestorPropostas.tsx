"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

type EstadoProposta = "PENDENTE" | "ACEITE" | "RECUSADA";

interface Proposta {
  id: string;
  preco: number;
  prazoDias: number;
  estado: EstadoProposta;
  agenteNome: string;
  empresa: string;
}

interface GestorPropostasProps {
  pedidoId: string;
  estadoPedido: "ABERTO" | "ATRIBUIDO" | "CONCLUIDO" | "CANCELADO";
  propostaAceiteId?: string;
  propostas: Proposta[];
}

const rotuloEstado: Record<EstadoProposta, string> = {
  PENDENTE: "Pendente",
  ACEITE: "Aceite",
  RECUSADA: "Recusada",
};

const corEstado: Record<EstadoProposta, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  ACEITE: "bg-green-100 text-green-800",
  RECUSADA: "bg-red-100 text-red-800",
};

const formatadorPreco = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export function GestorPropostas({
  pedidoId,
  estadoPedido,
  propostaAceiteId,
  propostas,
}: GestorPropostasProps) {
  const router = useRouter();
  const [emCurso, setEmCurso] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const aceitavel = estadoPedido === "ABERTO";

  async function decidir(propostaId: string, acao: "aceitar" | "recusar") {
    setEmCurso(propostaId);
    setErroGeral(null);

    try {
      const resposta = await fetch(`/api/propostas/${propostaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId, acao }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível efectuar esta acção. Tente novamente.");
        return;
      }

      router.refresh();
    } catch {
      setErroGeral(
        "Não foi possível ligar ao servidor. Verifique a ligação e tente de novo."
      );
    } finally {
      setEmCurso(null);
    }
  }

  return (
    <div className="mt-3">
      {erroGeral && <ErroFormulario mensagem={erroGeral} />}

      <ul className="mt-3 flex flex-col gap-3">
        {propostas.map((proposta) => {
          const aceite = proposta.estado === "ACEITE";
          return (
            <li
              key={proposta.id}
              className={`rounded-lg border px-4 py-3 ${
                aceite ? "border-green-300 bg-green-50" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{proposta.empresa}</p>
                  <p className="text-sm text-slate-600">{proposta.agenteNome}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${corEstado[proposta.estado]}`}
                >
                  {rotuloEstado[proposta.estado]}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {formatadorPreco.format(proposta.preco)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Prazo: {proposta.prazoDias} dia(s)
                  </p>
                </div>

                {aceitavel && proposta.estado === "PENDENTE" && (
                  <div className="flex gap-2">
                    <Button
                      variante="secundario"
                      aCarregar={emCurso === proposta.id}
                      disabled={emCurso !== null}
                      onClick={() => decidir(proposta.id, "recusar")}
                    >
                      Recusar
                    </Button>
                    <Button
                      aCarregar={emCurso === proposta.id}
                      disabled={emCurso !== null}
                      onClick={() => decidir(proposta.id, "aceitar")}
                    >
                      Aceitar
                    </Button>
                  </div>
                )}

                {propostaAceiteId === proposta.id && (
                  <span className="text-sm font-medium text-green-700">
                    Proposta escolhida
                  </span>
                )}

                {!aceitavel && proposta.estado === "PENDENTE" && (
                  <span className="text-sm text-slate-400">Pedido já fechado</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}