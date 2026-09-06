import { listarComissoes } from "@/servicos/adminServico";
import { Card } from "@/components/ui/Card";
import { Badge, estadoComissao } from "@/components/ui/Badge";
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
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Comissões</h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Confirme o recebimento das comissões cobradas aos agentes.
        </p>
      </div>

      {comissoes.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="text-text-primary">
            Ainda não há comissões registadas na plataforma.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comissoes.map((comissao) => {
            const agente = comissao.pedido.propostaAceite?.agente;
            const info = estadoComissao[comissao.estado];
            return (
              <li key={comissao.id}>
                <Card variante="primario">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{comissao.pedido.navio}</p>
                      <p className="text-sm text-text-secondary">
                        Agente: {agente?.perfilAgente?.nomeEmpresa ?? agente?.nome ?? "—"}
                      </p>
                      <p className="text-sm text-text-muted">
                        Comissão: {formatadorPreco.format(Number(comissao.valorComissao))} (
                        {Number(comissao.percentagem)}% de{" "}
                        {formatadorPreco.format(Number(comissao.valorBase))})
                      </p>
                      <p className="text-xs text-text-muted">
                        Criada em {formatadorData.format(comissao.criadoEm)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tom={info.tom}>{info.rotulo}</Badge>
                        <Badge tom={comissao.comprovativoNome ? "info" : "neutro"}>
                          {comissao.comprovativoNome ? "Comprovativo" : "Sem comprovativo"}
                        </Badge>
                      </div>
                      {comissao.comprovativoNome && (
                        <a
                          href={`/api/admin/comissoes/${comissao.id}/comprovativo`}
                          className="text-sm font-medium text-ocean-600 hover:text-navy-900"
                        >
                          Descarregar comprovativo
                        </a>
                      )}
                      {comissao.estado === "PENDENTE" &&
                        (comissao.comprovativoNome ? (
                          <ConfirmarPagamento comissaoId={comissao.id} />
                        ) : (
                          <p className="max-w-56 text-right text-xs text-text-muted">
                            Sem comprovativo — o agente deve anexar a prova antes
                            de poder confirmar.
                          </p>
                        ))}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
