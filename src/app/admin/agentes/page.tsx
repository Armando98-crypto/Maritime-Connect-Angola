import { listarAgentes } from "@/servicos/adminServico";
import { Card } from "@/components/ui/Card";
import { Badge, estadoLicenca } from "@/components/ui/Badge";
import { VerificarLicenca } from "./VerificarLicenca";

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PaginaAgentes() {
  const agentes = await listarAgentes();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Licenças de agentes
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Confirme as licenças dos agentes registados na plataforma.
        </p>
      </div>

      {agentes.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="text-text-primary">Ainda não há agentes registados.</p>
        </div>
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-gray-100 bg-white shadow-[var(--shadow-sm)] sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-0 text-text-muted">
                  <th className="px-5 py-3 font-medium">Empresa / agente</th>
                  <th className="px-5 py-3 font-medium">Licença</th>
                  <th className="px-5 py-3 font-medium">Registado em</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {agentes.map((agente) => {
                  const licenca = agente.perfilAgente?.licencaVerificada
                    ? estadoLicenca.verificada
                    : estadoLicenca.pendente;
                  return (
                    <tr key={agente.id} className="border-b border-gray-100 last:border-0 hover:bg-surface-0">
                      <td className="px-5 py-4">
                        <p className="font-medium text-text-primary">
                          {agente.perfilAgente?.nomeEmpresa ?? agente.nome}
                        </p>
                        <p className="text-text-secondary">{agente.nome}</p>
                        <p className="text-text-muted">{agente.email}</p>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">
                        {agente.perfilAgente?.numeroLicenca ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-text-muted">
                        {formatadorData.format(agente.criadoEm)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tom={licenca.tom}>{licenca.rotulo}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {agente.perfilAgente && (
                          <VerificarLicenca
                            userId={agente.id}
                            verificada={agente.perfilAgente.licencaVerificada}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile, em vez de overflow horizontal na tabela */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {agentes.map((agente) => {
              const licenca = agente.perfilAgente?.licencaVerificada
                ? estadoLicenca.verificada
                : estadoLicenca.pendente;
              return (
                <li key={agente.id}>
                  <Card variante="primario">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">
                          {agente.perfilAgente?.nomeEmpresa ?? agente.nome}
                        </p>
                        <p className="text-sm text-text-secondary">{agente.nome}</p>
                        <p className="text-sm text-text-muted">{agente.email}</p>
                        <p className="mt-1.5 text-sm text-text-secondary">
                          N.º de licença: {agente.perfilAgente?.numeroLicenca ?? "—"}
                        </p>
                        <p className="text-xs text-text-muted">
                          Registado em {formatadorData.format(agente.criadoEm)}
                        </p>
                      </div>
                      <Badge tom={licenca.tom}>{licenca.rotulo}</Badge>
                    </div>
                    {agente.perfilAgente && (
                      <div className="mt-4 flex justify-end">
                        <VerificarLicenca
                          userId={agente.id}
                          verificada={agente.perfilAgente.licencaVerificada}
                        />
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
