import Link from "next/link";
import { obterResumoAdmin } from "@/servicos/adminServico";
import { Card } from "@/components/ui/Card";

export default async function PaginaAdmin() {
  const resumo = await obterResumoAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Painel de administração
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Validar licenças de agentes e acompanhar a cobrança de comissões.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/agentes">
          <Card variante="interactivo">
            <p className="font-metric text-3xl font-semibold text-text-primary">
              {resumo.agentesPorVerificar}
            </p>
            <p className="mt-1 font-medium text-text-primary">Licenças de agentes</p>
            <p className="mt-0.5 text-sm text-text-secondary">
              {resumo.agentesPorVerificar === 1
                ? "1 agente por verificar."
                : `${resumo.agentesPorVerificar} agentes por verificar.`}
            </p>
          </Card>
        </Link>
        <Link href="/admin/comissoes">
          <Card variante="interactivo">
            <p className="font-metric text-3xl font-semibold text-text-primary">
              {resumo.comissoesPendentes}
            </p>
            <p className="mt-1 font-medium text-text-primary">Comissões</p>
            <p className="mt-0.5 text-sm text-text-secondary">
              {resumo.comissoesPendentes === 1
                ? "1 comissão por confirmar."
                : `${resumo.comissoesPendentes} comissões por confirmar.`}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}