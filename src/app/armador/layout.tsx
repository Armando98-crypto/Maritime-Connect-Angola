import type { ReactNode } from "react";
import { exigirSessaoArmador } from "@/lib/auth-guards";
import { AppShell } from "@/components/shell/AppShell";

export default async function LayoutArmador({ children }: { children: ReactNode }) {
  const sessao = await exigirSessaoArmador();

  return (
    <AppShell
      papel="ARMADOR"
      userId={sessao.user.id}
      userName={sessao.user.name ?? "Armador"}
      isAdmin={sessao.user.isAdmin}
    >
      {children}
    </AppShell>
  );
}
