"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, estadoProposta } from "@/components/ui/Badge";
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

  // Ordenar por preço ajuda directamente a decisão (secção 16 do
  // briefing: "a interface deve facilitar a tomada de decisão") — o
  // armador vê primeiro a proposta mais competitiva, sem ter de
  // comparar manualmente.
  const propostasOrdenadas = [...propostas].sort((a, b) => a.preco - b.preco);

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
    <div className="mt-4">
      {erroGeral && <ErroFormulario mensagem={erroGeral} />}

      <ul className="mt-3 flex flex-col gap-3">
        {propostasOrdenadas.map((proposta, indice) => {
          const aceite = proposta.estado === "ACEITE";
          const info = estadoProposta[proposta.estado];
          return (
            <li key={proposta.id}>
              <Card
                variante={aceite ? "destacado" : "primario"}
                className={aceite ? "" : "relative"}
              >
                {!aceite && indice === 0 && aceitavel && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Mais competitiva
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`font-semibold ${aceite ? "text-white" : "text-text-primary"}`}>
                      {proposta.empresa}
                    </p>
                    <p className={`text-sm ${aceite ? "text-white/70" : "text-text-secondary"}`}>
                      {proposta.agenteNome}
                    </p>
                  </div>
                  {!aceite && <Badge tom={info.tom}>{info.rotulo}</Badge>}
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className={`font-metric text-xl font-semibold ${aceite ? "text-white" : "text-text-primary"}`}>
                      {formatadorPreco.format(proposta.preco)}
                    </p>
                    <p className={`text-sm ${aceite ? "text-white/60" : "text-text-muted"}`}>
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
                        variante="primario"
                        aCarregar={emCurso === proposta.id}
                        disabled={emCurso !== null}
                        onClick={() => decidir(proposta.id, "aceitar")}
                      >
                        Aceitar
                      </Button>
                    </div>
                  )}

                  {propostaAceiteId === proposta.id && (
                    <span className="text-sm font-medium text-cyan-400">
                      Proposta escolhida
                    </span>
                  )}

                  {!aceitavel && proposta.estado === "PENDENTE" && (
                    <span className="text-sm text-text-muted">Pedido já fechado</span>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
