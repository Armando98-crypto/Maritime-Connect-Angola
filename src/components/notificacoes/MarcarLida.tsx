"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface MarcarLidaProps {
  notificacaoId: string;
}

export function MarcarLida({ notificacaoId }: MarcarLidaProps) {
  const router = useRouter();
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function marcar() {
    setACarregar(true);
    setErro(null);

    try {
      const resposta = await fetch(`/api/notificacoes/${notificacaoId}/ler`, {
        method: "PATCH",
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não foi possível marcar como lida.");
        return;
      }

      router.refresh();
    } catch {
      setErro("Não foi possível ligar ao servidor. Tente de novo.");
    } finally {
      setACarregar(false);
    }
  }

  if (erro) {
    return <ErroFormulario mensagem={erro} aoTentarNovamente={marcar} />;
  }

  return (
    <Button variante="secundario" aCarregar={aCarregar} onClick={marcar} className="text-xs px-2 py-1">
      Marcar como lida
    </Button>
  );
}
