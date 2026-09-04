"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface PagamentoComissaoProps {
  comissaoId: string;
}

export function PagamentoComissao({ comissaoId }: PagamentoComissaoProps) {
  const router = useRouter();
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function pagar() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch(`/api/comissoes/${comissaoId}/pagar`, {
        method: "POST",
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível marcar a comissão como paga.");
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
      {erroGeral && <ErroFormulario mensagem={erroGeral} aoTentarNovamente={pagar} />}
      <Button variante="secundario" aCarregar={aCarregar} onClick={pagar}>
        Marcar como paga
      </Button>
    </div>
  );
}