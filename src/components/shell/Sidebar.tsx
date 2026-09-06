"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "./icones";

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "file" | "bell" | "user" | "coin" | "shield";
  contador?: number;
}

interface SidebarProps {
  items: NavItem[];
  userName: string;
  rotuloPapel: string;
  aoSair: () => Promise<void>;
  children: ReactNode;
}

/**
 * Sidebar única para armador/agente/admin. A versão mobile reaproveita
 * o mesmo conteúdo de navegação num drawer de ecrã inteiro, em vez de
 * reduzir o desktop (secção 27 do briefing de design).
 */
export function Sidebar({ items, userName, rotuloPapel, aoSair, children }: SidebarProps) {
  const [abertoMobile, setAbertoMobile] = useState(false);
  const pathname = usePathname();

  function ehActivo(href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  const navegacao = (
    <>
      <div className="px-5 py-6">
        <Link href="/" className="font-display text-lg font-semibold text-white">
          Maritime Connect
        </Link>
        <p className="mt-0.5 text-xs text-white/50">Porto do Namibe</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setAbertoMobile(false)}
            aria-current={ehActivo(item.href) ? "page" : undefined}
            className={`flex items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors ${
              ehActivo(item.href)
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icone nome={item.icon} />
              {item.label}
            </span>
            {!!item.contador && item.contador > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
                {item.contador > 99 ? "99+" : item.contador}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-sm font-medium text-white">{userName}</p>
        <p className="mb-3 text-xs text-white/50">{rotuloPapel}</p>
        <form action={aoSair}>
          <button
            type="submit"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Sair
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-navy-900">
        {navegacao}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-navy-900 px-4 py-3 lg:hidden">
          <Link href="/" className="font-display font-semibold text-white">
            Maritime Connect
          </Link>
          <button
            type="button"
            onClick={() => setAbertoMobile(true)}
            aria-label="Abrir menu"
            className="p-1 text-white"
          >
            <Icone nome="menu" />
          </button>
        </header>

        {abertoMobile && (
          <div className="fixed inset-0 z-50 flex flex-col bg-navy-900 lg:hidden">
            <div className="flex justify-end px-4 py-3">
              <button
                type="button"
                onClick={() => setAbertoMobile(false)}
                aria-label="Fechar menu"
                className="p-1 text-white"
              >
                <Icone nome="x" />
              </button>
            </div>
            {navegacao}
          </div>
        )}

        <main className="flex-1 bg-surface-0">{children}</main>
      </div>
    </div>
  );
}
