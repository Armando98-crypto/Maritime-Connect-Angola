import { auth } from "@/lib/auth";
import { obterPerfilAgente } from "@/servicos/perfilServico";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge, estadoLicenca } from "@/components/ui/Badge";
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

  const licenca = perfil.licencaVerificada ? estadoLicenca.verificada : estadoLicenca.pendente;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">O meu perfil</h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        Dados da sua conta de agente de navegação.
      </p>

      <Card variante="primario" className="mt-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-text-muted">Nome</dt>
            <dd className="mt-1 font-medium text-text-primary">{perfil.user.nome}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-muted">Email</dt>
            <dd className="mt-1 font-medium text-text-primary">{perfil.user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-muted">Número de licença</dt>
            <dd className="mt-1 font-medium text-text-primary">{perfil.numeroLicenca}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-muted">Estado da licença</dt>
            <dd className="mt-1">
              <Badge tom={licenca.tom}>{licenca.rotulo}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-muted">Membro desde</dt>
            <dd className="mt-1 font-medium text-text-primary">
              {formatadorData.format(perfil.user.criadoEm)}
            </dd>
          </div>
        </dl>
      </Card>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">Editar empresa</h2>
        <p className="mt-1 text-[15px] text-text-secondary">
          Actualize o nome da sua empresa que aparece para os armadores.
        </p>
        <div className="mt-4">
          <PerfilForm nomeEmpresaInicial={perfil.nomeEmpresa} />
        </div>
      </section>
    </div>
  );
}
