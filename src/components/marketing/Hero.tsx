import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroCarrossel } from "@/components/marketing/HeroCarrossel";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-900 pt-36 pb-28 text-white">
      <HeroCarrossel />
      <div className="hero-entrada relative mx-auto max-w-4xl px-6 text-center">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Conectamos armadores e agentes para tornar cada operação marítima mais simples.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Publique um pedido, receba propostas de agentes de navegação verificados e
          escolha com informação — preço, prazo e reputação lado a lado, sem depender
          de contactos pessoais.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/registo" className="w-full sm:w-auto">
            <Button
              variante="secundario"
              tamanho="lg"
              className="w-full border-0 bg-white text-navy-900 hover:bg-white/90 sm:w-auto"
            >
              Criar conta gratuita
            </Button>
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ocean-600 px-6 py-3.5 text-base font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-ocean-500 hover:shadow-[var(--shadow-md)] active:translate-y-0 sm:w-auto"
          >
            Ver como funciona
          </a>
        </div>
      </div>
    </section>
  );
}
