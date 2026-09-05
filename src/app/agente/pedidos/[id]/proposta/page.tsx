import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterPedidoAbertoParaAgente } from "@/servicos/propostaServico";
import { obterPerfilAgente } from "@/servicos/perfilServico";
import { PropostaForm } from "./PropostaForm";

interface Parametros {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PaginaEnviarProposta({ params }: Parametros) {
  const { id } = await params;
  const sessao = await auth();
  const pedido = await obterPedidoAbertoParaAgente(id);

  if (!pedido) {
    notFound();
  }

  const formatadorData = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Bloqueio explicado na própria página — nunca escondido em
  // silêncio. A verificação real e definitiva acontece sempre no
  // serviço (criarProposta), mas mostrar isto aqui evita que o agente
  // preencha o formulário todo só para ser recusado no fim.
  const perfil = sessao?.user ? await obterPerfilAgente(sessao.user.id) : null;
  const licencaVerificada = perfil?.licencaVerificada ?? false;

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

      {licencaVerificada ? (
        <PropostaForm pedidoId={pedido.id} />
      ) : (
        <div
          role="alert"
          className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          A sua licença ainda não foi verificada por um administrador. Só
          pode enviar propostas depois de a verificação ser concluída.
        </div>
      )}
    </main>
  );
}