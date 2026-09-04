"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface ConcluirPedidoProps {
  pedidoId: string;
}

export function ConcluirPedido({ pedidoId }: ConcluirPedidoProps) {
  const router = useRouter();
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function concluir() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch(`/api/pedidos/${pedidoId}/concluir`, {
        method: "POST",
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível concluir o pedido. Tente novamente.");
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
    <div>
      {erroGeral && <ErroFormulario mensagem={erroGeral} aoTentarNovamente={concluir} />}
      <Button aCarregar={aCarregar} onClick={concluir} className="mt-3">
        Marcar como concluído
      </Button>
    </div>
  );
}