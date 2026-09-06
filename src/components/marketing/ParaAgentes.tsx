import { CardImagem } from "@/components/marketing/CardImagem";
import { Icone } from "@/components/shell/icones";

const beneficios = [
  {
    titulo: "Acesso a pedidos verificados",
    descricao: "Veja pedidos reais de armadores, publicados directamente na plataforma.",
  },
  {
    titulo: "Envie propostas sem intermediários",
    descricao: "Preço e prazo directamente ao armador — sem depender de quem o apresenta.",
  },
  {
    titulo: "Construa reputação visível",
    descricao: "Cada serviço concluído gera uma avaliação que fica associada ao seu perfil.",
  },
];

export function ParaAgentes() {
  return (
    <section id="agentes" className="bg-surface-0 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="order-2 lg:order-1">
          <CardImagem
            src="/img/card-2.jpg"
            alt="Agente de navegação a receber um navio no cais"
            legenda="Agente de navegação a receber um navio no cais"
          />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-medium uppercase tracking-wide text-ocean-600">
            Para agentes de navegação
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            Mais oportunidades, sem depender de quem conhece.
          </h2>
          <ul className="mt-8 flex flex-col gap-6">
            {beneficios.map((beneficio) => (
              <li key={beneficio.titulo} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-navy-900">
                  <Icone nome="coin" />
                </span>
                <div>
                  <p className="font-semibold text-text-primary">{beneficio.titulo}</p>
                  <p className="mt-1 text-[15px] text-text-secondary">{beneficio.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
