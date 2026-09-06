import { CardImagem } from "@/components/marketing/CardImagem";

const pontosDeAtrito = [
  {
    titulo: "Contacto informal",
    descricao:
      "O processo de agenciamento marítimo depende, hoje, de WhatsApp, chamadas e conhecimentos pessoais.",
  },
  {
    titulo: "Preços às cegas",
    descricao:
      "Sem comparação directa entre agentes, o armador negoceia sem saber se o valor pedido é competitivo.",
  },
  {
    titulo: "Sem reputação visível",
    descricao:
      "A escolha de um agente depende de quem se conhece, não de um histórico verificável de trabalho.",
  },
];

export function Contexto() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-ocean-600">
              A realidade actual
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
              Uma operação simples, feita de forma lenta.
            </h2>

            <div className="mt-12 flex flex-col gap-9">
              {pontosDeAtrito.map((ponto) => (
                <div key={ponto.titulo}>
                  <div className="mb-3 h-px w-10 bg-ocean-500" />
                  <h3 className="text-lg font-semibold text-text-primary">{ponto.titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                    {ponto.descricao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <CardImagem
            src="/img/card-3.jpg"
            alt="Operação logística no Porto do Namibe"
            legenda="Operação logística no Porto do Namibe"
            tamanho="(min-width: 1024px) 40vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
