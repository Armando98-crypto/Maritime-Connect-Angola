import Link from "next/link";
import { obterResumoAdmin } from "@/servicos/adminServico";

export default async function PaginaAdmin() {
  const resumo = await obterResumoAdmin();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Painel de administração
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Validar licenças de agentes e acompanhar a cobrança de comissões.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/agentes"
          className="rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-sky-700"
        >
          <p className="font-medium text-slate-900">Licenças de agentes</p>
          <p className="mt-1 text-sm text-slate-600">
            {resumo.agentesPorVerificar === 1
              ? "1 agente por verificar."
              : `${resumo.agentesPorVerificar} agentes por verificar.`}
          </p>
        </Link>
        <Link
          href="/admin/comissoes"
          className="rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-sky-700"
        >
          <p className="font-medium text-slate-900">Comissões</p>
          <p className="mt-1 text-sm text-slate-600">
            {resumo.comissoesPendentes === 1
              ? "1 comissão por confirmar."
              : `${resumo.comissoesPendentes} comissões por confirmar.`}
          </p>
        </Link>
      </div>
    </main>
  );
}