"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface ConfirmarPagamentoProps {
  comissaoId: string;
}

export function ConfirmarPagamento({ comissaoId }: ConfirmarPagamentoProps) {
  const router = useRouter();
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function confirmar() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch(`/api/admin/comissoes/${comissaoId}/pagar`, {
        method: "POST",
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível confirmar o pagamento.");
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
    <div className="flex flex-col items-end gap-2">
      {erroGeral && (
        <ErroFormulario mensagem={erroGeral} aoTentarNovamente={confirmar} />
      )}
      <Button variante="secundario" aCarregar={aCarregar} onClick={confirmar}>
        Confirmar pagamento
      </Button>
    </div>
  );
}