import Link from "next/link";
import { auth } from "@/lib/auth";
import { obterResumoArmador } from "@/servicos/dashboardServico";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { estadoPedido } from "@/components/ui/Badge";

const ordemEstados = ["ABERTO", "ATRIBUIDO", "CONCLUIDO", "CANCELADO"] as const;

export default async function PaginaDashboardArmador() {
  const sessao = await auth();
  const resumo = await obterResumoArmador(sessao!.user.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Olá, {sessao!.user.name}
      </h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        Vista rápida dos seus pedidos no Porto do Namibe.
      </p>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="font-metric text-3xl font-semibold text-text-primary">
            {resumo.totalPedidos}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Total de pedidos</p>
        </div>

        <div
          className={`rounded-[var(--radius-card)] p-5 ${
            resumo.propostasAguardaDecisao > 0
              ? "bg-warning-bg"
              : "bg-white shadow-[var(--shadow-sm)]"
          }`}
        >
          <p
            className={`font-metric text-3xl font-semibold ${
              resumo.propostasAguardaDecisao > 0 ? "text-warning" : "text-text-primary"
            }`}
          >
            {resumo.propostasAguardaDecisao}
          </p>
          <p
            className={`mt-1 text-sm ${
              resumo.propostasAguardaDecisao > 0 ? "text-warning" : "text-text-secondary"
            }`}
          >
            Propostas por decidir
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">Pedidos por estado</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ordemEstados.map((estado) => {
            const quantidade = resumo.porEstado[estado] ?? 0;
            const info = estadoPedido[estado];
            const corPonto: Record<string, string> = {
              info: "bg-ocean-500",
              aviso: "bg-warning",
              sucesso: "bg-success",
              neutro: "bg-gray-500",
              erro: "bg-danger",
            };
            return (
              <li key={estado}>
                <Card variante="secundario" className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-2.5 font-medium text-text-primary">
                    <span className={`h-2 w-2 rounded-full ${corPonto[info.tom]}`} />
                    {info.rotulo}
                  </span>
                  <span className="font-metric text-lg font-semibold text-text-primary">
                    {quantidade}
                  </span>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/armador/pedidos">
          <Button variante="primario">Ver os meus pedidos</Button>
        </Link>
        {resumo.propostasAguardaDecisao > 0 && (
          <Link href="/armador/pedidos">
            <Button variante="secundario">Decidir propostas recebidas</Button>
          </Link>
        )}
        <Link href="/armador/pedidos/novo">
          <Button variante="secundario">Novo pedido</Button>
        </Link>
      </div>
    </div>
  );
}
