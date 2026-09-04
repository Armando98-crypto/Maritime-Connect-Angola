import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  listarPedidosAbertosParaAgente,
  listarPropostasDoAgente,
} from "@/servicos/propostaServico";
import { listarAvaliacoesRecebidas } from "@/servicos/avaliacaoServico";
import { Button } from "@/components/ui/Button";

const rotuloEstadoProposta: Record<string, string> = {
  PENDENTE: "Pendente",
  ACEITE: "Aceite",
  RECUSADA: "Recusada",
};

const corEstadoProposta: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  ACEITE: "bg-green-100 text-green-800",
  RECUSADA: "bg-red-100 text-red-800",
};

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

export default async function PaginaQuadroPedidos() {
  const sessao = await auth();
  const pedidos = await listarPedidosAbertosParaAgente();
  const minhasPropostas = await listarPropostasDoAgente(sessao!.user.id);
  const avaliacoes = await listarAvaliacoesRecebidas(sessao!.user.id);

  // Marcamos os pedidos para os quais o agente já enviou proposta,
  // para não os voltar a oferecer (e o serviço também bloqueia no
  // servidor, como rede de segurança).
  const pedidosComProposta = new Set(
    minhasPropostas.map((p) => p.pedidoId)
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Pedidos abertos no porto
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Porto do Namibe. Escolha um pedido para enviar a sua proposta.
        </p>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="text-slate-600">
            De momento não há pedidos abertos.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Assim que um armador publicar um pedido, ele aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {pedidos.map((pedido) => {
            const jaProposto = pedidosComProposta.has(pedido.id);
            return (
              <li
                key={pedido.id}
                className="rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{pedido.navio}</p>
                    <p className="text-sm text-slate-600">
                      Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {pedido._count.propostas === 0
                        ? "Ainda sem propostas."
                        : `${pedido._count.propostas} proposta(s) recebida(s).`}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{pedido.detalhes}</p>
                <div className="mt-3">
                  {jaProposto ? (
                    <span className="text-sm font-medium text-sky-700">
                      Proposta enviada
                    </span>
                  ) : (
                    <Link href={`/agente/pedidos/${pedido.id}/proposta`}>
                      <Button>Enviar proposta</Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {minhasPropostas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">As minhas propostas</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {minhasPropostas.map((proposta) => (
              <li
                key={proposta.id}
                className="rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{proposta.pedido.navio}</p>
                    <p className="text-sm text-slate-600">
                      Preço: {formatadorPreco.format(Number(proposta.preco))}
                    </p>
                    <p className="text-sm text-slate-500">
                      Prazo: {proposta.prazoDias} dia(s)
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${corEstadoProposta[proposta.estado]}`}
                  >
                    {rotuloEstadoProposta[proposta.estado]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {avaliacoes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">As minhas avaliações</h2>
          <p className="mt-1 text-sm text-slate-600">
            {avaliacoes.length === 1
              ? "Recebeu 1 avaliação de serviços."
              : `Recebeu ${avaliacoes.length} avaliações de serviços.`}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {avaliacoes.map((avaliacao) => (
              <li
                key={avaliacao.id}
                className="rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {avaliacao.pedido.navio}
                    </p>
                    <div className="mt-1 text-base text-sky-700">
                      {"★".repeat(avaliacao.nota)}
                      {"☆".repeat(5 - avaliacao.nota)}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-sm text-slate-500">
                    {avaliacao.nota}/5
                  </span>
                </div>
                {avaliacao.comentario && (
                  <p className="mt-2 text-sm text-slate-600">{avaliacao.comentario}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
