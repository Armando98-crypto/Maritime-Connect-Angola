import { notFound } from "next/navigation";
import { obterPedidoAbertoParaAgente } from "@/servicos/propostaServico";
import { PropostaForm } from "./PropostaForm";

interface Parametros {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PaginaEnviarProposta({ params }: Parametros) {
  const { id } = await params;
  const pedido = await obterPedidoAbertoParaAgente(id);

  if (!pedido) {
    notFound();
  }

  const formatadorData = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Enviar proposta</h1>

      <div className="mt-4 rounded-lg border border-slate-200 px-4 py-3">
        <p className="font-medium text-slate-900">{pedido.navio}</p>
        <p className="text-sm text-slate-600">
          Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
        </p>
        <p className="mt-1 text-sm text-slate-500">{pedido.detalhes}</p>
      </div>

      <PropostaForm pedidoId={pedido.id} />
    </main>
  );
}