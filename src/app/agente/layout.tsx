import type { ReactNode } from "react";
import { exigirSessaoAgente } from "@/lib/auth-guards";
import { AppShell } from "@/components/shell/AppShell";

export default async function LayoutAgente({ children }: { children: ReactNode }) {
  const sessao = await exigirSessaoAgente();

  return (
    <AppShell
      papel="AGENTE"
      userId={sessao.user.id}
      userName={sessao.user.name ?? "Agente"}
      isAdmin={sessao.user.isAdmin}
    >
      {children}
    </AppShell>
  );
}
