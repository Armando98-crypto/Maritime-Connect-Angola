"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErroFormulario, SucessoFormulario } from "@/components/estado/Alertas";

interface PerfilFormProps {
  nomeEmpresaInicial: string;
}

export function PerfilForm({ nomeEmpresaInicial }: PerfilFormProps) {
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState(nomeEmpresaInicial);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function guardar() {
    setACarregar(true);
    setErro(null);
    setSucesso(false);

    try {
      const resposta = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeEmpresa }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não foi possível actualizar o perfil.");
        return;
      }

      setSucesso(true);
      router.refresh();
    } catch {
      setErro("Não foi possível ligar ao servidor. Tente de novo.");
    } finally {
      setACarregar(false);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); guardar(); }} className="flex flex-col gap-4">
      {erro && <ErroFormulario mensagem={erro} aoTentarNovamente={guardar} />}
      {sucesso && <SucessoFormulario mensagem="Perfil actualizado." />}
      <Input
        label="Nome da empresa"
        value={nomeEmpresa}
        onChange={(e) => setNomeEmpresa(e.target.value)}
        required
      />
      <div>
        <Button type="submit" variante="primario" aCarregar={aCarregar}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
