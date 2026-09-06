import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CtaFinal() {
  return (
    <section className="bg-surface-0 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          Comece hoje, seja qual for o seu lado da operação.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] text-text-secondary">
          Criar conta é gratuito e demora menos de um minuto.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/registo" className="w-full sm:w-auto">
            <Button variante="primario" tamanho="lg" className="w-full sm:w-auto">
              Sou armador
            </Button>
          </Link>
          <Link href="/registo" className="w-full sm:w-auto">
            <Button variante="secundario" tamanho="lg" className="w-full sm:w-auto">
              Sou agente de navegação
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
