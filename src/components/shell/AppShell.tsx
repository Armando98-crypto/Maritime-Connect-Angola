import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { contarNaoLidas } from "@/servicos/notificacaoServico";
import { Sidebar, type NavItem } from "./Sidebar";

interface AppShellProps {
  papel: "ARMADOR" | "AGENTE" | "ADMIN";
  userId: string;
  userName: string;
  isAdmin?: boolean;
  children: ReactNode;
}

const rotulosPapel: Record<AppShellProps["papel"], string> = {
  ARMADOR: "Armador",
  AGENTE: "Agente de navegação",
  ADMIN: "Administrador",
};

async function sair() {
  "use server";
  await signOut({ redirectTo: "/" });
}

function montarNavegacao(
  papel: AppShellProps["papel"],
  naoLidas: number,
  isAdmin: boolean
): NavItem[] {
  const base: Record<AppShellProps["papel"], NavItem[]> = {
    ARMADOR: [
      { href: "/armador/dashboard", label: "Quadro de bordo", icon: "home" },
      { href: "/armador/pedidos", label: "Pedidos", icon: "file" },
      {
        href: "/armador/notificacoes",
        label: "Notificações",
        icon: "bell",
        contador: naoLidas,
      },
    ],
    AGENTE: [
      { href: "/agente/dashboard", label: "Quadro de bordo", icon: "home" },
      { href: "/agente/pedidos", label: "Pedidos disponíveis", icon: "file" },
      { href: "/agente/perfil", label: "Perfil", icon: "user" },
      {
        href: "/agente/notificacoes",
        label: "Notificações",
        icon: "bell",
        contador: naoLidas,
      },
    ],
    ADMIN: [
      { href: "/admin", label: "Início", icon: "home" },
      { href: "/admin/agentes", label: "Agentes", icon: "user" },
      { href: "/admin/comissoes", label: "Comissões", icon: "coin" },
    ],
  };

  const items = [...base[papel]];

  // Atalho para quem tem sessão de armador/agente mas também é admin
  // (flag isAdmin na BD) — evita ter de trocar de área manualmente.
  if (isAdmin && papel !== "ADMIN") {
    items.push({ href: "/admin", label: "Administração", icon: "shield" });
  }

  return items;
}

export async function AppShell({
  papel,
  userId,
  userName,
  isAdmin = false,
  children,
}: AppShellProps) {
  const naoLidas = papel !== "ADMIN" ? await contarNaoLidas(userId) : 0;
  const items = montarNavegacao(papel, naoLidas, isAdmin);

  return (
    <Sidebar
      items={items}
      userName={userName}
      rotuloPapel={rotulosPapel[papel]}
      aoSair={sair}
    >
      {children}
    </Sidebar>
  );
}
