import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
  tituloPainel: string;
  descricaoPainel: string;
}

/**
 * Layout partilhado por login, registo e (no futuro) recuperação de
 * password. A imagem de fundo dá contexto ao porto; à esquerda o logo
 * e a proposta de valor em ciano, e à direita o formulário num cartão
 * com desfoque (backdrop-blur) por cima da imagem.
 */
export function AuthLayout({ children, tituloPainel, descricaoPainel }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <Image
        src="/img/login.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 object-cover"
      />
      <div className="absolute inset-0 bg-navy-900/70" aria-hidden="true" />

      <div className="relative grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
        <div className="text-center lg:text-left">
          <Link
            href="/"
            className="inline-flex bg-white px-7 py-3 font-display text-2xl font-semibold text-ocean-600 shadow-[var(--shadow-md)] lg:text-3xl"
          >
            Maritime Connect
          </Link>
          <h1 className="mx-auto mt-6 max-w-md font-display text-3xl font-semibold leading-tight text-white lg:mx-0 lg:text-4xl">
            {tituloPainel}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/80 sm:text-base lg:mx-0">
            {descricaoPainel}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[var(--radius-card)] bg-white/85 px-7 py-8 shadow-[var(--shadow-md)] backdrop-blur-xl sm:px-9 sm:py-9">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            © {new Date().getFullYear()} Maritime Connect Angola
          </p>
        </div>
      </div>
    </div>
  );
}
