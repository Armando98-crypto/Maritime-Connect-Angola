"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface VerificarLicencaProps {
  userId: string;
  verificada: boolean;
}

export function VerificarLicenca({ userId, verificada }: VerificarLicencaProps) {
  const router = useRouter();
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function actualizar(novoEstado: boolean) {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch(`/api/admin/agentes/${userId}/verificacao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificada: novoEstado }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível actualizar a licença.");
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
        <ErroFormulario
          mensagem={erroGeral}
          aoTentarNovamente={() => actualizar(!verificada)}
        />
      )}
      {verificada ? (
        <Button variante="secundario" aCarregar={aCarregar} onClick={() => actualizar(false)}>
          Marcar como pendente
        </Button>
      ) : (
        <Button aCarregar={aCarregar} onClick={() => actualizar(true)}>
          Verificar licença
        </Button>
      )}
    </div>
  );
}