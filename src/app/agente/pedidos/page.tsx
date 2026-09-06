import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  listarPedidosAbertosParaAgente,
  listarPropostasDoAgente,
} from "@/servicos/propostaServico";
import { listarAvaliacoesRecebidas } from "@/servicos/avaliacaoServico";
import { listarComissoesDoAgente } from "@/servicos/comissaoServico";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, estadoProposta, estadoComissao } from "@/components/ui/Badge";
import { BuscaPedidos } from "./BuscaPedidos";
import { EnviarComprovativo } from "./EnviarComprovativo";

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

export default async function PaginaQuadroPedidos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sessao = await auth();
  const { q } = await searchParams;
  const pedidos = await listarPedidosAbertosParaAgente(q);
  const minhasPropostas = await listarPropostasDoAgente(sessao!.user.id);
  const avaliacoes = await listarAvaliacoesRecebidas(sessao!.user.id);
  const comissoes = await listarComissoesDoAgente(sessao!.user.id);

  // Marcamos os pedidos para os quais o agente já enviou proposta, para
  // não os voltar a oferecer (o serviço também bloqueia no servidor).
  const pedidosComProposta = new Set(minhasPropostas.map((p) => p.pedidoId));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Pedidos abertos no porto
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Porto do Namibe. Escolha um pedido para enviar a sua proposta.
        </p>
      </div>

      <Suspense>
        <BuscaPedidos />
      </Suspense>

      {pedidos.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="text-text-primary">De momento não há pedidos abertos.</p>
          <p className="mt-1.5 text-[15px] text-text-secondary">
            Assim que um armador publicar um pedido, ele aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((pedido) => {
            const jaProposto = pedidosComProposta.has(pedido.id);
            return (
              <li key={pedido.id}>
                <Card variante="primario">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{pedido.navio}</p>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
                      </p>
                      <p className="text-sm text-text-muted">
                        {pedido._count.propostas === 0
                          ? "Ainda sem propostas."
                          : `${pedido._count.propostas} proposta(s) recebida(s).`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[15px] text-text-secondary">{pedido.detalhes}</p>
                  <div className="mt-4">
                    {jaProposto ? (
                      <Badge tom="info">Proposta enviada</Badge>
                    ) : (
                      <Link href={`/agente/pedidos/${pedido.id}/proposta`}>
                        <Button variante="primario">Enviar proposta</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {minhasPropostas.length > 0 && (
        <section id="minhas-propostas" className="mt-14">
          <h2 className="text-lg font-semibold text-text-primary">As minhas propostas</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {minhasPropostas.map((proposta) => {
              const info = estadoProposta[proposta.estado];
              return (
                <li key={proposta.id}>
                  <Card variante="secundario" className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">{proposta.pedido.navio}</p>
                      <p className="text-sm text-text-secondary">
                        Preço: {formatadorPreco.format(Number(proposta.preco))}
                      </p>
                      <p className="text-sm text-text-muted">
                        Prazo: {proposta.prazoDias} dia(s)
                      </p>
                    </div>
                    <Badge tom={info.tom}>{info.rotulo}</Badge>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {avaliacoes.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-text-primary">As minhas avaliações</h2>
          <p className="mt-1 text-[15px] text-text-secondary">
            {avaliacoes.length === 1
              ? "Recebeu 1 avaliação de serviços."
              : `Recebeu ${avaliacoes.length} avaliações de serviços.`}
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {avaliacoes.map((avaliacao) => (
              <li key={avaliacao.id}>
                <Card variante="secundario">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">{avaliacao.pedido.navio}</p>
                      <div className="mt-1 text-base text-warning">
                        {"★".repeat(avaliacao.nota)}
                        {"☆".repeat(5 - avaliacao.nota)}
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-sm text-text-muted">
                      {avaliacao.nota}/5
                    </span>
                  </div>
                  {avaliacao.comentario && (
                    <p className="mt-2 text-sm text-text-secondary">{avaliacao.comentario}</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {comissoes.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold text-text-primary">As minhas comissões</h2>
          <p className="mt-1 text-[15px] text-text-secondary">
            Comissão da plataforma sobre o valor da proposta aceite. Envie o
            comprovativo do pagamento; o estado passa a &quot;paga&quot; quando a
            plataforma confirmar.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {comissoes.map((comissao) => {
              const info = estadoComissao[comissao.estado];
              return (
                <li key={comissao.id}>
                  <Card variante="secundario">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-text-primary">{comissao.navio}</p>
                        <p className="text-sm text-text-secondary">
                          Comissão: {formatadorPreco.format(Number(comissao.valorComissao))}
                        </p>
                        <p className="text-sm text-text-muted">
                          {Number(comissao.percentagem)}% de{" "}
                          {formatadorPreco.format(Number(comissao.valorBase))}
                        </p>
                      </div>
                      {comissao.estado === "PENDENTE" ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Badge tom={info.tom}>{info.rotulo}</Badge>
                            {comissao.comprovativoNome && (
                              <Badge tom="info">Comprovativo enviado</Badge>
                            )}
                          </div>
                          <p className="max-w-56 text-right text-xs text-text-muted">
                            {comissao.comprovativoNome
                              ? "Aguarda confirmação da plataforma. Pode substituir o comprovativo."
                              : "Anexe o comprovativo do pagamento."}
                          </p>
                          <EnviarComprovativo
                            comissaoId={comissao.id}
                            temComprovativo={Boolean(comissao.comprovativoNome)}
                          />
                        </div>
                      ) : (
                        <Badge tom={info.tom}>{info.rotulo}</Badge>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
