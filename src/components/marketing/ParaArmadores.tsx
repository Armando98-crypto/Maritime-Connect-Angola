import { CardImagem } from "@/components/marketing/CardImagem";
import { Icone } from "@/components/shell/icones";

const beneficios = [
  {
    titulo: "Publique um pedido em minutos",
    descricao: "Navio, data prevista de chegada e detalhes — sem burocracia.",
  },
  {
    titulo: "Compare propostas lado a lado",
    descricao: "Preço e prazo de cada agente, na mesma página, sem negociação dispersa.",
  },
  {
    titulo: "Escolha com informação",
    descricao: "Decida com base em dados, não em quem conhece — a decisão final é sempre sua.",
  },
];

export function ParaArmadores() {
  return (
    <section id="armadores" className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-ocean-600">
            Para armadores
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            O agenciamento do seu navio, sem depender de contactos.
          </h2>
          <ul className="mt-8 flex flex-col gap-6">
            {beneficios.map((beneficio) => (
              <li key={beneficio.titulo} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-ocean-600">
                  <Icone nome="file" />
                </span>
                <div>
                  <p className="font-semibold text-text-primary">{beneficio.titulo}</p>
                  <p className="mt-1 text-[15px] text-text-secondary">{beneficio.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <CardImagem
          src="/img/card-1.jpg"
          alt="Navio de carga no Porto do Namibe"
          legenda="Navio de carga no Porto do Namibe"
        />
      </div>
    </section>
  );
}
