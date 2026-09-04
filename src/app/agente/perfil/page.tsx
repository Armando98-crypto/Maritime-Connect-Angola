import { auth } from "@/lib/auth";
import { obterPerfilAgente } from "@/servicos/perfilServico";
import { redirect } from "next/navigation";
import { PerfilForm } from "./PerfilForm";

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PaginaPerfilAgente() {
  const sessao = await auth();
  const perfil = await obterPerfilAgente(sessao!.user.id);

  if (!perfil) {
    redirect("/agente/dashboard");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">O meu perfil</h1>
      <p className="mt-1 text-sm text-slate-600">
        Dados da sua conta de agente de navegação.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 px-6 py-5">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Nome</dt>
            <dd className="mt-1 font-medium text-slate-900">{perfil.user.nome}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="mt-1 font-medium text-slate-900">{perfil.user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Número de licença</dt>
            <dd className="mt-1 font-medium text-slate-900">{perfil.numeroLicenca}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Estado da licença</dt>
            <dd className="mt-1">
              {perfil.licencaVerificada ? (
                <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                  Verificada
                </span>
              ) : (
                <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  Pendente de verificação
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Membro desde</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {formatadorData.format(perfil.user.criadoEm)}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Editar empresa</h2>
        <p className="mt-1 text-sm text-slate-600">
          Actualize o nome da sua empresa que aparece para os armadores.
        </p>
        <div className="mt-4">
          <PerfilForm nomeEmpresaInicial={perfil.nomeEmpresa} />
        </div>
      </section>
    </main>
  );
}
