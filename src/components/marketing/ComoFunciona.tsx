const passos = [
  { numero: "01", titulo: "Pedido", descricao: "O armador publica navio, data e detalhes do serviço." },
  { numero: "02", titulo: "Propostas", descricao: "Agentes verificados respondem com preço e prazo." },
  { numero: "03", titulo: "Comparação", descricao: "O armador vê todas as propostas lado a lado." },
  { numero: "04", titulo: "Escolha", descricao: "Uma proposta é aceite; as restantes ficam fechadas." },
  { numero: "05", titulo: "Operação", descricao: "O agente presta o serviço de agenciamento combinado." },
  { numero: "06", titulo: "Avaliação", descricao: "O armador conclui o pedido e avalia o agente." },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-ocean-600">
            Como funciona
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            Do pedido à avaliação, em seis passos.
          </h2>
        </div>

        <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {passos.map((passo) => (
            <div key={passo.numero} className="relative pl-14">
              <span className="font-metric absolute left-0 top-0 text-3xl font-semibold text-gray-300">
                {passo.numero}
              </span>
              <h3 className="text-base font-semibold text-text-primary">{passo.titulo}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">
                {passo.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
