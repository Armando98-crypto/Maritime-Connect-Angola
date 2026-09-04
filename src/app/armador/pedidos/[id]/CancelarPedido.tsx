"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface CancelarPedidoProps {
  pedidoId: string;
}

export function CancelarPedido({ pedidoId }: CancelarPedidoProps) {
  const router = useRouter();
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function cancelar() {
    if (!confirm("Tem a certeza que deseja cancelar este pedido? As propostas pendentes serão automaticamente recusadas.")) {
      return;
    }

    setACarregar(true);
    setErro(null);

    try {
      const resposta = await fetch(`/api/pedidos/${pedidoId}/cancelar`, {
        method: "POST",
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não foi possível cancelar o pedido.");
        return;
      }

      router.refresh();
    } catch {
      setErro("Não foi possível ligar ao servidor. Tente de novo.");
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div>
      {erro && <ErroFormulario mensagem={erro} aoTentarNovamente={cancelar} />}
      <Button variante="secundario" aCarregar={aCarregar} onClick={cancelar} className="text-sm">
        Cancelar pedido
      </Button>
    </div>
  );
}
