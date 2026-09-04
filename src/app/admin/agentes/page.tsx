import { listarAgentes } from "@/servicos/adminServico";
import { VerificarLicenca } from "./VerificarLicenca";

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PaginaAgentes() {
  const agentes = await listarAgentes();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Licenças de agentes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Confirme as licenças dos agentes registados na plataforma.
        </p>
      </div>

      {agentes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="text-slate-600">Ainda não há agentes registados.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {agentes.map((agente) => (
            <li
              key={agente.id}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {agente.perfilAgente?.nomeEmpresa ?? agente.nome}
                  </p>
                  <p className="text-sm text-slate-600">{agente.nome}</p>
                  <p className="text-sm text-slate-500">{agente.email}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    N.º de licença: {agente.perfilAgente?.numeroLicenca ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Registado em {formatadorData.format(agente.criadoEm)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {agente.perfilAgente?.licencaVerificada ? (
                    <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                      Verificada
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Pendente de verificação
                    </span>
                  )}
                  {agente.perfilAgente && (
                    <VerificarLicenca
                      userId={agente.id}
                      verificada={agente.perfilAgente.licencaVerificada}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}