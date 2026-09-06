"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icone } from "@/components/shell/icones";

const linksNav = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#armadores", label: "Para armadores" },
  { href: "#agentes", label: "Para agentes" },
  { href: "#confianca", label: "Confiança" },
];

/**
 * Transparente sobre o Hero, torna-se sólido ao fazer scroll (secção 12
 * do briefing de design). O texto começa branco (sobre o Hero navy) e
 * muda para navy assim que o fundo fica branco, para manter contraste.
 */
export function HeaderPublico() {
  const [comScroll, setComScroll] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setComScroll(window.scrollY > 24);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const corTexto = comScroll ? "text-navy-900" : "text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-200 ${
        comScroll ? "bg-white/95 shadow-[var(--shadow-sm)] backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className={`font-display text-lg font-semibold ${corTexto}`}>
          Maritime Connect
        </Link>

        <nav className={`hidden items-center gap-8 text-sm font-medium lg:flex ${corTexto}`}>
          {linksNav.map((link) => (
            <a key={link.href} href={link.href} className="opacity-80 hover:opacity-100">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className={`text-sm font-medium ${corTexto}`}>
            Entrar
          </Link>
          <Link href="/registo">
            <Button variante={comScroll ? "primario" : "secundario"} tamanho="sm" className={comScroll ? "" : "border-white/40 bg-white/10 text-white hover:bg-white/20"}>
              Criar conta
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className={`p-1 lg:hidden ${corTexto}`}
        >
          <Icone nome="menu" />
        </button>
      </div>

      {menuAberto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-navy-900 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-white">
              Maritime Connect
            </span>
            <button
              type="button"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
              className="p-1 text-white"
            >
              <Icone nome="x" />
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-6 text-lg font-medium text-white">
            {linksNav.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuAberto(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-10 flex flex-col gap-3">
            <Link href="/login" onClick={() => setMenuAberto(false)}>
              <Button variante="secundario" className="w-full border-white/40 bg-transparent text-white">
                Entrar
              </Button>
            </Link>
            <Link href="/registo" onClick={() => setMenuAberto(false)}>
              <Button variante="primario" className="w-full bg-white text-navy-900 hover:bg-white/90">
                Criar conta
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
