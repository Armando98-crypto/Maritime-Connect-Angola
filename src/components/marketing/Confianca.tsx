import { Icone } from "@/components/shell/icones";

const mecanismos = [
  {
    icon: "shield" as const,
    titulo: "Licença verificada",
    descricao: "Nenhum agente envia propostas sem a licença confirmada por um administrador da plataforma.",
  },
  {
    icon: "file" as const,
    titulo: "Preços transparentes",
    descricao: "Todas as propostas de um pedido ficam visíveis ao armador, lado a lado, sem valores escondidos.",
  },
  {
    icon: "user" as const,
    titulo: "Avaliação após cada serviço",
    descricao: "Cada pedido concluído gera uma avaliação — a reputação do agente reflecte trabalho real.",
  },
];

export function Confianca() {
  return (
    <section id="confianca" className="bg-navy-900 py-24 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-400">Confiança</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Transparência que se vê, não que se promete.
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {mecanismos.map((mecanismo) => (
            <div key={mecanismo.titulo}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-cyan-400">
                <Icone nome={mecanismo.icon} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{mecanismo.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                {mecanismo.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
