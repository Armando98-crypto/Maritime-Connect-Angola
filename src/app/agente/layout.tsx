import type { ReactNode } from "react";
import Link from "next/link";
import { exigirSessaoAgente } from "@/lib/auth-guards";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { NotificacaoBadge } from "@/components/notificacoes/NotificacaoBadge";

export default async function LayoutAgente({ children }: { children: ReactNode }) {
  const sessao = await exigirSessaoAgente();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/agente/dashboard" className="font-semibold text-slate-900">
              Maritime Connect Angola
            </Link>
            <nav className="hidden text-sm text-slate-600 sm:flex sm:items-center sm:gap-3">
              <Link href="/agente/dashboard" className="hover:text-sky-700">
                Quadro de bordo
              </Link>
              <Link href="/agente/pedidos" className="hover:text-sky-700">
                Pedidos
              </Link>
              <Link href="/agente/perfil" className="hover:text-sky-700">
                Perfil
              </Link>
              {sessao.user.isAdmin && (
                <Link href="/admin" className="hover:text-sky-700">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificacaoBadge href="/agente/notificacoes" />
            <span className="text-sm text-slate-600">{sessao.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variante="secundario" className="px-3 py-1.5 text-sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
