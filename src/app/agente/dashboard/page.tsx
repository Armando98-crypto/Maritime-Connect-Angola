import Link from "next/link";
import { auth } from "@/lib/auth";
import { obterResumoAgente } from "@/servicos/dashboardServico";
import { Button } from "@/components/ui/Button";

const rotuloProposta: Record<string, string> = {
  PENDENTE: "Pendentes",
  ACEITE: "Aceites",
  RECUSADA: "Recusadas",
};

const corProposta: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  ACEITE: "bg-green-100 text-green-800",
  RECUSADA: "bg-red-100 text-red-800",
};

const formatadorMoeda = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export default async function PaginaDashboardAgente() {
  const sessao = await auth();
  const resumo = await obterResumoAgente(sessao!.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Olá, {sessao!.user.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Quadro de bordo — Porto do Namibe.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-3xl font-semibold text-slate-900">
            {resumo.pedidosAbertos}
          </p>
          <p className="text-sm text-slate-500">Pedidos abertos</p>
        </div>

        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-3xl font-semibold text-slate-900">
            {resumo.propostasPorEstado["PENDENTE"] ?? 0}
          </p>
          <p className="text-sm text-slate-500">Propostas pendentes</p>
        </div>

        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-3xl font-semibold text-slate-900">
            {resumo.propostasPorEstado["ACEITE"] ?? 0}
          </p>
          <p className="text-sm text-slate-500">Pedidos atribuídos</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Propostas</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(["PENDENTE", "ACEITE", "RECUSADA"] as const).map((estado) => {
            const qtd = resumo.propostasPorEstado[estado] ?? 0;
            return (
              <li
                key={estado}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <span className="font-medium text-slate-700">
                  {rotuloProposta[estado]}
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${corProposta[estado]}`}
                >
                  {qtd}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Comissões</h2>
        <div className="mt-3 rounded-lg border border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">
                {resumo.comissoesPendentes} comissão(ões) pendente(s)
              </p>
              <p className="text-sm text-slate-500">
                Total a pagar:{" "}
                {formatadorMoeda.format(resumo.totalComissaoPendente)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Avaliação</h2>
        <div className="mt-3 rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-3xl font-semibold text-slate-900">
            {resumo.mediaAvaliacoes !== null ? `${resumo.mediaAvaliacoes}/5` : "Sem avaliações"}
          </p>
          <p className="text-sm text-slate-500">Média recebida dos armadores</p>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/agente/pedidos">
          <Button>Ver pedidos abertos</Button>
        </Link>
        <Link href="/agente/pedidos">
          <Button variante="secundario">As minhas propostas</Button>
        </Link>
      </div>
    </main>
  );
}