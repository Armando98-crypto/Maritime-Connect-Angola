import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterPedidoAbertoParaAgente } from "@/servicos/propostaServico";
import { obterPerfilAgente } from "@/servicos/perfilServico";
import { Card } from "@/components/ui/Card";
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
    <div className="mx-auto max-w-lg px-6 py-10 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Enviar proposta
      </h1>

      <Card variante="secundario" className="mt-5">
        <p className="font-medium text-text-primary">{pedido.navio}</p>
        <p className="mt-1 text-sm text-text-secondary">
          Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
        </p>
        <p className="mt-1.5 text-sm text-text-muted">{pedido.detalhes}</p>
      </Card>

      {licencaVerificada ? (
        <PropostaForm pedidoId={pedido.id} />
      ) : (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-control)] border border-warning/25 bg-warning-bg px-4 py-3 text-sm text-warning"
        >
          A sua licença ainda não foi verificada por um administrador. Só
          pode enviar propostas depois de a verificação ser concluída.
        </div>
      )}
    </div>
  );
}