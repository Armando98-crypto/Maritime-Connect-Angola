import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterPedidoComPropostas } from "@/servicos/propostaServico";
import { Button } from "@/components/ui/Button";
import { GestorPropostas } from "./GestorPropostas";
import { ConcluirPedido } from "./ConcluirPedido";
import { AvaliarPedido } from "./AvaliarPedido";

interface Parametros {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

const rotuloEstado: Record<string, string> = {
  ABERTO: "Aberto",
  ATRIBUIDO: "Atribuído",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const corEstado: Record<string, string> = {
  ABERTO: "bg-sky-100 text-sky-800",
  ATRIBUIDO: "bg-amber-100 text-amber-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-slate-200 text-slate-600",
};

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PaginaGestaoPedido({ params }: Parametros) {
  const sessao = await auth();
  const { id } = await params;
  const pedido = await obterPedidoComPropostas(id, sessao!.user.id);

  if (!pedido) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/armador/pedidos"
        className="text-sm font-medium text-sky-700 hover:underline"
      >
        ← Os meus pedidos
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{pedido.navio}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{pedido.detalhes}</p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${corEstado[pedido.estado]}`}
        >
          {rotuloEstado[pedido.estado]}
        </span>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Propostas recebidas</h2>

        {pedido.propostas.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-slate-600">
              Ainda não recebeu nenhuma proposta para este pedido.
            </p>
            <p className="mt-1 text-sm text-slate-500">
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
        <div className="mt-8 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600">
          Ao aceitar uma proposta, o pedido passa a <strong>Atribuído</strong> e as
          restantes propostas pendentes são recusadas automaticamente.
        </div>
      )}

      {pedido.estado === "ATRIBUIDO" && (
        <div className="mt-8 rounded-lg border border-slate-200 px-4 py-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Serviço concluído?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quando o serviço estiver concluído, marque o pedido como tal para
            poder avaliar o agente.
          </p>
          <ConcluirPedido pedidoId={pedido.id} />
        </div>
      )}

      {pedido.estado === "CONCLUIDO" && (
        <div className="mt-8 rounded-lg border border-slate-200 px-4 py-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Avaliar o serviço
          </h2>

          {pedido.avaliacao ? (
            <div className="mt-3">
              <p className="text-sm text-slate-600">
                Já avaliou este serviço com a nota <strong>{pedido.avaliacao.nota}</strong>.
              </p>
              <div className="mt-1 text-base text-sky-700">
                {"★".repeat(pedido.avaliacao.nota)}
                {"☆".repeat(5 - pedido.avaliacao.nota)}
              </div>
              {pedido.avaliacao.comentario && (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {pedido.avaliacao.comentario}
                </p>
              )}
            </div>
          ) : (
            <AvaliarPedido pedidoId={pedido.id} navio={pedido.navio} />
          )}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Link href="/armador/pedidos">
          <Button variante="secundario">Voltar</Button>
        </Link>
      </div>
    </main>
  );
}