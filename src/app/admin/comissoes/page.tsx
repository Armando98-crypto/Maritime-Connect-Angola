import { listarComissoes } from "@/servicos/adminServico";
import { ConfirmarPagamento } from "./ConfirmarPagamento";

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatadorPreco = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export default async function PaginaComissoes() {
  const comissoes = await listarComissoes();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Comissões</h1>
        <p className="mt-1 text-sm text-slate-600">
          Confirme o recebimento das comissões cobradas aos agentes.
        </p>
      </div>

      {comissoes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="text-slate-600">
            Ainda não há comissões registadas na plataforma.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comissoes.map((comissao) => {
            const agente = comissao.pedido.propostaAceite?.agente;
            return (
              <li
                key={comissao.id}
                className="rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{comissao.pedido.navio}</p>
                    <p className="text-sm text-slate-600">
                      Agente: {agente?.perfilAgente?.nomeEmpresa ?? agente?.nome ?? "—"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Comissão: {formatadorPreco.format(Number(comissao.valorComissao))} (
                      {Number(comissao.percentagem)}% de{" "}
                      {formatadorPreco.format(Number(comissao.valorBase))})
                    </p>
                    <p className="text-xs text-slate-400">
                      Criada em {formatadorData.format(comissao.criadoEm)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {comissao.estado === "PENDENTE" ? (
                        <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          Pendente
                        </span>
                      ) : (
                        <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                          Paga
                        </span>
                      )}
                      {comissao.comprovativoNome ? (
                        <span className="whitespace-nowrap rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                          Comprovativo
                        </span>
                      ) : (
                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Sem comprovativo
                        </span>
                      )}
                    </div>
                    {comissao.comprovativoNome && (
                      <a
                        href={`/api/admin/comissoes/${comissao.id}/comprovativo`}
                        className="text-sm font-medium text-sky-700 hover:underline"
                      >
                        Descarregar comprovativo
                      </a>
                    )}
                    {comissao.estado === "PENDENTE" &&
                      (comissao.comprovativoNome ? (
                        <ConfirmarPagamento comissaoId={comissao.id} />
                      ) : (
                        <p className="max-w-56 text-right text-xs text-slate-500">
                          Sem comprovativo — o agente deve anexar a prova antes
                          de poder confirmar.
                        </p>
                      ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}