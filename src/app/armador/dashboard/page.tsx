import Link from "next/link";
import { auth } from "@/lib/auth";
import { obterResumoArmador } from "@/servicos/dashboardServico";
import { Button } from "@/components/ui/Button";

const rotuloEstado: Record<string, string> = {
  ABERTO: "Abertos",
  ATRIBUIDO: "Atribuídos",
  CONCLUIDO: "Concluídos",
  CANCELADO: "Cancelados",
};

const corEstado: Record<string, string> = {
  ABERTO: "bg-sky-100 text-sky-800",
  ATRIBUIDO: "bg-amber-100 text-amber-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-slate-200 text-slate-600",
};

export default async function PaginaDashboardArmador() {
  const sessao = await auth();
  const resumo = await obterResumoArmador(sessao!.user.id);
  const estados = ["ABERTO", "ATRIBUIDO", "CONCLUIDO", "CANCELADO"];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        Olá, {sessao!.user.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Aqui tem uma vista rápida dos seus pedidos no Porto do Namibe.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-3xl font-semibold text-slate-900">
            {resumo.totalPedidos}
          </p>
          <p className="text-sm text-slate-500">Total de pedidos</p>
        </div>

        {resumo.propostasAguardaDecisao > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-3xl font-semibold text-amber-800">
              {resumo.propostasAguardaDecisao}
            </p>
            <p className="text-sm text-amber-700">Propostas por decidir</p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Pedidos por estado</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {estados.map((estado) => {
            const quantidade = resumo.porEstado[estado] ?? 0;
            return (
              <li
                key={estado}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <span className="font-medium text-slate-700">
                  {rotuloEstado[estado]}
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${corEstado[estado]}`}
                >
                  {quantidade}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/armador/pedidos">
          <Button>Ver os meus pedidos</Button>
        </Link>
        {resumo.propostasAguardaDecisao > 0 && (
          <Link href="/armador/pedidos">
            <Button variante="secundario">
              Decidir propostas recebidas
            </Button>
          </Link>
        )}
        <Link href="/armador/pedidos/novo">
          <Button variante="secundario">Novo pedido</Button>
        </Link>
      </div>
    </main>
  );
}