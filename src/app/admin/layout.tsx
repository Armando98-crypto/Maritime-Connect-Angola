import type { ReactNode } from "react";
import { exigirSessaoAdmin } from "@/lib/auth-guards";
import { AppShell } from "@/components/shell/AppShell";

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const sessao = await exigirSessaoAdmin();

  return (
    <AppShell papel="ADMIN" userId={sessao.user.id} userName={sessao.user.name ?? "Administrador"}>
      {children}
    </AppShell>
  );
}
