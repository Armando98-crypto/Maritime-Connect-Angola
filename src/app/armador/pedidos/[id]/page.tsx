import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterPedidoComPropostas } from "@/servicos/propostaServico";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, estadoPedido } from "@/components/ui/Badge";
import { GestorPropostas } from "./GestorPropostas";
import { ConcluirPedido } from "./ConcluirPedido";
import { AvaliarPedido } from "./AvaliarPedido";
import { CancelarPedido } from "./CancelarPedido";

interface Parametros {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

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

export default async function PaginaGestaoPedido({ params }: Parametros) {
  const sessao = await auth();
  const { id } = await params;
  const pedido = await obterPedidoComPropostas(id, sessao!.user.id);

  if (!pedido) {
    notFound();
  }

  const info = estadoPedido[pedido.estado];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
      <Link
        href="/armador/pedidos"
        className="text-sm font-medium text-ocean-600 hover:text-navy-900"
      >
        ← Os meus pedidos
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {pedido.navio}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
          </p>
          <p className="mt-1 text-sm text-text-muted">{pedido.detalhes}</p>
        </div>
        <Badge tom={info.tom}>{info.rotulo}</Badge>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">Propostas recebidas</h2>

        {pedido.propostas.length === 0 ? (
          <div className="mt-3 rounded-[var(--radius-card)] border border-dashed border-gray-300 px-6 py-12 text-center">
            <p className="text-text-primary">
              Ainda não recebeu nenhuma proposta para este pedido.
            </p>
            <p className="mt-1 text-[15px] text-text-secondary">
              Quando um agente enviar uma proposta, ela aparece aqui.
            </p>
          </div>
        ) : (
          <GestorPropostas
            pedidoId={pedido.id}
            estadoPedido={pedido.estado}
            propostaAceiteId={pedido.propostaAceiteId ?? undefined}
            propostas={pedido.propostas.map((p) => ({
              id: p.id,
              preco: Number(p.preco),
              prazoDias: p.prazoDias,
              estado: p.estado,
              agenteNome: p.agente.nome,
              empresa: p.agente.perfilAgente?.nomeEmpresa ?? "Agente",
            }))}
          />
        )}
      </div>

      {pedido.estado === "ABERTO" && pedido.propostas.length > 0 && (
        <p className="mt-6 text-sm text-text-secondary">
          Ao aceitar uma proposta, o pedido passa a{" "}
          <strong className="text-text-primary">Atribuído</strong> e as restantes
          propostas pendentes são recusadas automaticamente.
        </p>
      )}

      {pedido.estado === "ABERTO" && (
        <div className="mt-4">
          <CancelarPedido pedidoId={pedido.id} />
        </div>
      )}

      {pedido.estado === "ATRIBUIDO" && (
        <Card variante="secundario" className="mt-10">
          <h2 className="text-lg font-semibold text-text-primary">Serviço concluído?</h2>
          <p className="mt-1 text-[15px] text-text-secondary">
            Quando o serviço estiver concluído, marque o pedido como tal para
            poder avaliar o agente.
          </p>
          <div className="mt-4">
            <ConcluirPedido pedidoId={pedido.id} />
          </div>
        </Card>
      )}

      {pedido.estado === "CONCLUIDO" && (
        <Card variante="secundario" className="mt-10">
          <h2 className="text-lg font-semibold text-text-primary">Avaliar o serviço</h2>

          {pedido.avaliacao ? (
            <div className="mt-3">
              <p className="text-[15px] text-text-secondary">
                Já avaliou este serviço com a nota{" "}
                <strong className="text-text-primary">{pedido.avaliacao.nota}</strong>.
              </p>
              <div className="mt-1 text-base text-warning">
                {"★".repeat(pedido.avaliacao.nota)}
                {"☆".repeat(5 - pedido.avaliacao.nota)}
              </div>
              {pedido.avaliacao.comentario && (
                <p className="mt-3 rounded-[var(--radius-control)] bg-white px-3.5 py-2.5 text-sm text-text-secondary">
                  {pedido.avaliacao.comentario}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <AvaliarPedido pedidoId={pedido.id} navio={pedido.navio} />
            </div>
          )}
        </Card>
      )}

      {pedido.comissao && (
        <Card variante="secundario" className="mt-10">
          <h2 className="text-lg font-semibold text-text-primary">Comissão da plataforma</h2>
          <p className="mt-1 text-[15px] text-text-secondary">
            Comissão gerada ao aceitar a proposta. É cobrada ao agente escolhido.
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-text-muted">Valor base</dt>
              <dd className="font-metric font-semibold text-text-primary">
                {formatadorPreco.format(Number(pedido.comissao.valorBase))}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-text-muted">Percentagem</dt>
              <dd className="font-metric font-semibold text-text-primary">
                {Number(pedido.comissao.percentagem)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm text-text-muted">Comissão</dt>
              <dd className="font-metric font-semibold text-text-primary">
                {formatadorPreco.format(Number(pedido.comissao.valorComissao))}
              </dd>
            </div>
          </dl>
        </Card>
      )}

      <div className="mt-10 flex justify-end">
        <Link href="/armador/pedidos">
          <Button variante="secundario">Voltar</Button>
        </Link>
      </div>
    </div>
  );
}
