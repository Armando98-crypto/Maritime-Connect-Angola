const incluido = [
  "Representação do navio junto das autoridades portuárias",
  "Apoio documental para entrada e saída do porto",
  "Coordenação logística durante a estadia no porto",
  "Acompanhamento da operação até à conclusão",
];

/**
 * Nota de âmbito: a plataforma suporta apenas UM serviço (agenciamento
 * marítimo) e UM porto (Namibe) nesta fase — ver a "regra de ouro" do
 * projecto. Esta secção descreve o âmbito do único serviço existente,
 * em vez de listar vários serviços que a plataforma ainda não oferece.
 */
export function Servico() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-ocean-600">
          O serviço
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          Agenciamento marítimo no Porto do Namibe.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary">
          Um serviço, feito bem. É nisto que a plataforma se concentra nesta fase.
        </p>

        <div className="mx-auto mt-12 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
          {incluido.map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-control)] border border-gray-100 bg-surface-0 px-4 py-3.5 text-[15px] text-text-primary"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
