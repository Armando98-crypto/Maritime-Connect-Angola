"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

interface EnviarComprovativoProps {
  comissaoId: string;
  temComprovativo: boolean;
}

export function EnviarComprovativo({
  comissaoId,
  temComprovativo,
}: EnviarComprovativoProps) {
  const router = useRouter();
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  async function enviar() {
    if (!ficheiro) {
      setErroGeral("Escolha o comprovativo antes de enviar.");
      return;
    }

    setACarregar(true);
    setErroGeral(null);

    try {
      const dados = new FormData();
      dados.append("comprovativo", ficheiro);

      const resposta = await fetch(`/api/comissoes/${comissaoId}/comprovativo`, {
        method: "POST",
        body: dados,
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível enviar o comprovativo.");
        return;
      }

      setFicheiro(null);
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
    <div className="flex w-full flex-col items-end gap-2">
      {erroGeral && <ErroFormulario mensagem={erroGeral} aoTentarNovamente={enviar} />}
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
        className="flex flex-col items-end gap-2"
      >
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(evento) => setFicheiro(evento.target.files?.[0] ?? null)}
          className="text-sm text-slate-600"
        />
        <Button
          type="submit"
          variante="secundario"
          aCarregar={aCarregar}
          className="px-3 py-1.5 text-sm"
        >
          {temComprovativo ? "Substituir comprovativo" : "Enviar comprovativo"}
        </Button>
      </form>
    </div>
  );
}