import type { ReactNode } from "react";
import Link from "next/link";
import { exigirSessaoArmador } from "@/lib/auth-guards";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function LayoutArmador({ children }: { children: ReactNode }) {
  const sessao = await exigirSessaoArmador();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/armador/dashboard" className="font-semibold text-slate-900">
              Maritime Connect Angola
            </Link>
            <nav className="hidden text-sm text-slate-600 sm:flex sm:items-center sm:gap-3">
              <Link href="/armador/dashboard" className="hover:text-sky-700">
                Quadro de bordo
              </Link>
              <Link href="/armador/pedidos" className="hover:text-sky-700">
                Pedidos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
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
