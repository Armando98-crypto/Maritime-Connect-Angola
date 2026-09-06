import Link from "next/link";
import { auth } from "@/lib/auth";
import { obterResumoAgente } from "@/servicos/dashboardServico";
import { obterPerfilAgente } from "@/servicos/perfilServico";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { estadoProposta } from "@/components/ui/Badge";

const formatadorMoeda = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export default async function PaginaDashboardAgente() {
  const sessao = await auth();
  const [resumo, perfil] = await Promise.all([
    obterResumoAgente(sessao!.user.id),
    obterPerfilAgente(sessao!.user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Olá, {sessao!.user.name}
      </h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        Quadro de bordo — Porto do Namibe.
      </p>

      {perfil && !perfil.licencaVerificada && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-warning/25 bg-warning-bg px-5 py-4">
          <p className="font-medium text-warning">Licença por verificar</p>
          <p className="mt-1 text-[15px] text-warning">
            Só pode enviar propostas depois de um administrador confirmar a sua
            licença. Isto costuma demorar pouco tempo.
          </p>
        </div>
      )}

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="font-metric text-3xl font-semibold text-text-primary">
            {resumo.pedidosAbertos}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Pedidos abertos</p>
        </div>
        <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="font-metric text-3xl font-semibold text-text-primary">
            {resumo.propostasPorEstado["PENDENTE"] ?? 0}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Propostas pendentes</p>
        </div>
        <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="font-metric text-3xl font-semibold text-text-primary">
            {resumo.propostasPorEstado["ACEITE"] ?? 0}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Pedidos atribuídos</p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-text-primary">Propostas</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {(["PENDENTE", "ACEITE", "RECUSADA"] as const).map((estado) => {
              const qtd = resumo.propostasPorEstado[estado] ?? 0;
              const info = estadoProposta[estado];
              const corPonto: Record<string, string> = {
                aviso: "bg-warning",
                sucesso: "bg-success",
                neutro: "bg-gray-500",
              };
              return (
                <Card key={estado} variante="secundario" className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-2.5 font-medium text-text-primary">
                    <span className={`h-2 w-2 rounded-full ${corPonto[info.tom]}`} />
                    {info.rotulo}
                  </span>
                  <span className="font-metric text-lg font-semibold text-text-primary">
                    {qtd}
                  </span>
                </Card>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">Comissões e avaliação</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Card variante="secundario">
              <p className="font-medium text-text-primary">
                {resumo.comissoesPendentes} comissão(ões) pendente(s)
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Total a pagar: {formatadorMoeda.format(resumo.totalComissaoPendente)}
              </p>
            </Card>
            <Card variante="secundario">
              <p className="font-metric text-2xl font-semibold text-text-primary">
                {resumo.mediaAvaliacoes !== null ? `${resumo.mediaAvaliacoes}/5` : "Sem avaliações"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">Média recebida dos armadores</p>
            </Card>
          </div>
        </section>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/agente/pedidos">
          <Button variante="primario">Ver pedidos abertos</Button>
        </Link>
        <Link href="/agente/pedidos#minhas-propostas">
          <Button variante="secundario">As minhas propostas</Button>
        </Link>
      </div>
    </div>
  );
}
