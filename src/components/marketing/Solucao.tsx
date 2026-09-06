import { Card } from "@/components/ui/Card";
import { Icone } from "@/components/shell/icones";

const pilares = [
  {
    icon: "file" as const,
    titulo: "Um pedido, várias respostas",
    descricao:
      "O armador publica o pedido uma vez; os agentes verificados respondem com propostas — sem troca de mensagens dispersas.",
  },
  {
    icon: "coin" as const,
    titulo: "Preços comparáveis",
    descricao:
      "Todas as propostas de um pedido aparecem lado a lado, com preço e prazo, para uma decisão informada.",
  },
  {
    icon: "shield" as const,
    titulo: "Agentes verificados",
    descricao:
      "A licença de cada agente é confirmada antes de poder enviar propostas — não fica apenas indicada, é validada.",
  },
];

export function Solucao() {
  return (
    <section className="bg-surface-0 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-ocean-600">
            A solução
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            Um único lugar para pedir, comparar e decidir.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {pilares.map((pilar) => (
            <Card key={pilar.titulo} variante="primario">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-ocean-100 text-ocean-600">
                <Icone nome={pilar.icon} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">{pilar.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
                {pilar.descricao}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
